// src/components/canvas/EntityNode.tsx

'use client';

import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

import styles from './EntityNode.module.css';
import type { CanvasEntity } from '@/lib/types/canvas.types';
import { EntityShapeRenderer } from './shapes/ShapeRegistry';

type Props = {
  entity: CanvasEntity;
  isSelected: boolean;
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

export default function EntityNode({
  entity,
  isSelected,
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
      <EntityShapeRenderer
        shapeKey={entity.systemType?.shape_key}
        entity={entity}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
      />

      <Html position={[0, 0, labelHeight]} center distanceFactor={10}>
        <div
          className={`${styles.nodeLabel} ${
            isSelected ? styles.nodeLabelSelected : ''
          }`}
          dir="rtl"
        >
          <span className={styles.nodeLabelBadge}>
            {entity.systemType?.name?.substring(0, 3).toUpperCase() ?? 'SYS'}
          </span>
          <span className={styles.nodeLabelText}>{entity.name}</span>
        </div>
      </Html>
    </group>
  );
}
