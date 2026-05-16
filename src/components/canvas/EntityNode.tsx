// src/components/canvas/EntityNode.tsx

'use client';

import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import styles from './canvas.module.css';
import type { CanvasEntity } from '@/lib/types/canvas.types';

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

function getEntityVisualConfig(systemTypeName?: string) {
  // نام نوع سیستم را برای مقایسه یکپارچه کوچک می‌کنیم
  const normalizedType = systemTypeName?.toLowerCase() || 'generic';

  switch (normalizedType) {
    case 'macro':
      return {
        color: '#3b82f6',
        emissive: '#1d4ed8',
        geometry: [1.7, 0.9, 1.2] as [number, number, number],
        opacity: 1,
        badge: 'MACRO',
      };

    case 'fem':
      return {
        color: '#10b981',
        emissive: '#047857',
        geometry: [1.45, 1.0, 1.0] as [number, number, number],
        opacity: 0.84,
        badge: 'FEM',
      };

    case 'environment':
      return {
        color: '#f59e0b',
        emissive: '#b45309',
        geometry: [2.1, 0.35, 2.1] as [number, number, number],
        opacity: 0.64,
        badge: 'ENV',
      };

    default:
      return {
        color: '#94a3b8',
        emissive: '#475569',
        geometry: [1.1, 1.1, 1.1] as [number, number, number],
        opacity: 0.95,
        badge: 'GEN',
      };
  }
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
  const meshRef = useRef<THREE.Mesh>(null);

  const [dragging, setDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState<[number, number, number]>(
    entity.position
  );

  useEffect(() => {
    if (!dragging) {
      setLocalPosition(entity.position);
    }
  }, [entity.position, dragging]);

  // استفاده از systemType.name به جای entityType
  const visual = useMemo(
    () => getEntityVisualConfig(entity.systemType?.name),
    [entity.systemType?.name]
  );

  const dragPlane = useMemo(() => {
    return new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -localPosition[1]
    );
  }, [localPosition]);

  const tempPoint = useMemo(() => new THREE.Vector3(), []);

  const meshColor = useMemo(() => {
    if (dragging) return '#ef4444';
    if (isSelected) return '#facc15';
    if (isEdgeSource) return '#a855f7';
    return visual.color;
  }, [dragging, isSelected, isEdgeSource, visual.color]);

  const meshEmissive = useMemo(() => {
    if (isSelected) return '#facc15';
    if (isEdgeSource) return '#7e22ce';
    return visual.emissive;
  }, [isSelected, isEdgeSource, visual.emissive]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (mode === 'select') {
      onSelect(entity.uuid);
      return;
    }

    onCreateEdgeClick(entity.uuid);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (mode === 'select') {
      onSelect(entity.uuid);
      setDragging(true);

      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        // no-op
      }

      return;
    }

    onCreateEdgeClick(entity.uuid);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (mode !== 'select') return;

    if (dragging) {
      setDragging(false);
      onPositionCommit(entity, localPosition);
    }

    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || mode !== 'select') return;

    e.stopPropagation();

    if (!e.ray) return;

    const hit = e.ray.intersectPlane(dragPlane, tempPoint);
    if (!hit) return;

    const nextPosition: [number, number, number] = [
      Number(hit.x.toFixed(2)),
      entity.position[1],
      Number(hit.z.toFixed(2)),
    ];

    setLocalPosition(nextPosition);
  };

  return (
    <group position={localPosition}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={visual.geometry} />

        <meshStandardMaterial
          color={meshColor}
          emissive={meshEmissive}
          emissiveIntensity={isSelected || isEdgeSource ? 0.24 : 0.06}
          metalness={0.18}
          roughness={0.58}
          transparent={visual.opacity < 1}
          opacity={visual.opacity}
        />
      </mesh>

      <Html
        position={[0, visual.geometry[1] / 2 + 0.35, 0]}
        center
        distanceFactor={10}
        transform={false}
        occlude={false}
      >
        <div
          className={[
            styles.nodeLabel,
            isSelected ? styles.nodeLabelSelected : '',
            isEdgeSource ? styles.nodeLabelEdgeSource : '',
          ]
            .filter(Boolean)
            .join(' ')}
          dir="rtl"
        >
          <span className={styles.nodeLabelBadge}>{visual.badge}</span>
          <span className={styles.nodeLabelText} title={entity.name}>
            {entity.name}
          </span>
          {entity.code ? (
            <span className={styles.nodeLabelCode} title={entity.code}>
              {entity.code}
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}
