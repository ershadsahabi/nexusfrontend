// src/components/canvas/EntityNode.tsx

'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useWorkspaceStatusStore } from '@/store/useWorkspaceStatusStore';

import styles from './EntityNode.module.css';
import type { CanvasEntity } from '@/lib/types/canvas.types';
import { EntityShapeRenderer } from './shapes/ShapeRegistry';
import FemNodeBadge from './FemNodeBadge';

type Props = {
  entity: CanvasEntity;
  isSelected: boolean;
  isFocused: boolean;
  isEdgeSource: boolean;
  mode: 'select' | 'create-edge';
  onSelect: (uuid: string) => void;
  onCreateEdgeClick: (uuid: string) => void;
  onPositionCommit: (
    entity: CanvasEntity,
    nextPosition: [number, number, number]
  ) => void;
};

function getLabelHeight(entity: CanvasEntity) {
  const metadata = (entity.metadata ?? {}) as Record<string, unknown>;

  if (typeof metadata.labelHeight === 'number') return metadata.labelHeight;
  if (typeof metadata.height === 'number') return metadata.height + 0.5;

  return 1.2;
}

function getFocusRadius(entity: CanvasEntity) {
  const metadata = (entity.metadata ?? {}) as Record<string, unknown>;

  const radius =
    typeof metadata.radius === 'number' ? metadata.radius : undefined;

  const width =
    typeof metadata.width === 'number' ? metadata.width : undefined;

  const depth =
    typeof metadata.depth === 'number' ? metadata.depth : undefined;

  const diameterFromBox =
    width !== undefined || depth !== undefined
      ? Math.max(width ?? 0, depth ?? 0) / 2
      : undefined;

  return Math.max(radius ?? 0, diameterFromBox ?? 0, 1.2) + 0.35;
}

export default function EntityNode({
  entity,
  isSelected,
  isFocused,
  isEdgeSource,
  mode,
  onSelect,
  onCreateEdgeClick,
  onPositionCommit,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState<[number, number, number]>(
    entity.position
  );

  const femWorkspaceStatus = useWorkspaceStatusStore((state) =>
    state.getByEntityUuid(entity.uuid, 'FEM')
  );

  const focusRingRef = useRef<THREE.Group>(null);
  const focusMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (!dragging) {
      setLocalPosition(entity.position);
    }
  }, [entity.position, dragging]);

  const dragPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, 0, 1), -localPosition[2]);
  }, [localPosition[2]]);

  const tempPoint = useMemo(() => new THREE.Vector3(), []);
  const labelHeight = useMemo(() => getLabelHeight(entity), [entity]);
  const focusRadius = useMemo(() => getFocusRadius(entity), [entity]);

  useFrame(({ clock }) => {
    if (!isFocused) return;

    const elapsed = clock.getElapsedTime();
    const pulse = 1 + Math.sin(elapsed * 3.2) * 0.045;

    if (focusRingRef.current) {
      focusRingRef.current.scale.setScalar(pulse);
    }

    if (focusMaterialRef.current) {
      focusMaterialRef.current.opacity = 0.42 + Math.sin(elapsed * 3.2) * 0.16;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (mode === 'create-edge') {
      onCreateEdgeClick(entity.uuid);
      return;
    }

    onSelect(entity.uuid);
    setDragging(true);

    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // noop
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (dragging) {
      setDragging(false);
      onPositionCommit(entity, localPosition);
    }

    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch {
      // noop
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || mode !== 'select' || !e.ray) return;

    e.stopPropagation();

    const hit = e.ray.intersectPlane(dragPlane, tempPoint);
    if (!hit) return;

    setLocalPosition([
      Number(hit.x.toFixed(2)),
      Number(hit.y.toFixed(2)),
      entity.position[2],
    ]);
  };

  return (
    <group
      position={localPosition}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {isFocused && (
        <group ref={focusRingRef} position={[0, 0, 0.04]}>
          <mesh>
            <ringGeometry args={[focusRadius, focusRadius + 0.08, 96]} />
            <meshBasicMaterial
              ref={focusMaterialRef}
              color="#f59e0b"
              transparent
              opacity={0.5}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh>
            <ringGeometry
              args={[focusRadius + 0.18, focusRadius + 0.21, 96]}
            />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.28}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <pointLight
            color="#f59e0b"
            intensity={0.9}
            distance={4}
            position={[0, 0, 1.2]}
          />
        </group>
      )}

      <EntityShapeRenderer
        shapeKey={entity.systemType?.shape_key}
        entity={entity}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
      />

      <Html position={[0, 0, labelHeight]} center distanceFactor={10}>
        <div
          className={[
            styles.nodeLabel,
            isSelected ? styles.nodeLabelSelected : '',
            isFocused ? styles.nodeLabelFocused : '',
            isEdgeSource ? styles.nodeLabelEdgeSource : '',
          ].join(' ')}
          dir="rtl"
        >
          <span className={styles.nodeLabelBadge}>
            {entity.systemType?.name?.substring(0, 3).toUpperCase() ?? 'SYS'}
          </span>

          <span className={styles.nodeLabelText}>{entity.name}</span>

          <FemNodeBadge status={femWorkspaceStatus} />
        </div>
      </Html>
    </group>
  );
}
