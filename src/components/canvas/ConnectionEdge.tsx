// src/components/canvas/ConnectionEdge.tsx

'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useCanvasStore } from '@/store/useCanvasStore';

interface Props {
  sourceUuid: string;
  targetUuid: string;
  isSelected: boolean;
  onSelect: (uuid: string) => void;
  connectionUuid: string;
}

export default function ConnectionEdge({
  sourceUuid,
  targetUuid,
  isSelected,
  onSelect,
  connectionUuid,
}: Props) {
  const entities = useCanvasStore((state) => state.entities);

  const points = useMemo(() => {
    const source = entities.find((e) => e.uuid === sourceUuid);
    const target = entities.find((e) => e.uuid === targetUuid);

    if (!source || !target) return null;

    return [
      new THREE.Vector3(...source.position),
      new THREE.Vector3(...target.position),
    ];
  }, [entities, sourceUuid, targetUuid]);

  if (!points) return null;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(connectionUuid);
      }}
    >
      <Line
        points={points}
        color={isSelected ? '#facc15' : '#64748b'}
        lineWidth={isSelected ? 3 : 1.5}
        transparent
        opacity={0.72}
      />

      <Line
        points={points}
        color="#ffffff"
        lineWidth={10}
        transparent
        opacity={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(connectionUuid);
        }}
      />
    </group>
  );
}
