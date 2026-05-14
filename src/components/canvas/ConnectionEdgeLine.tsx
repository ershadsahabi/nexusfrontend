// src/components/canvas/ConnectionEdgeLine.tsx

'use client';

import { Html, Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';

import type { CanvasConnection, CanvasEntity } from '@/lib/types/canvas.types';
import styles from './canvas.module.css';

type Props = {
  connection: CanvasConnection;
  source: CanvasEntity;
  target: CanvasEntity;
  isSelected: boolean;
  onSelect: (uuid: string) => void;
  onDelete: (uuid: string) => void;
};

function getRelationVisual(relationType: CanvasConnection['relationType']) {
  switch (relationType) {
    case 'supports':
      return { color: '#f59e0b', width: 2.4, dashed: false, label: 'supports' };

    case 'transfers_load_to':
      return { color: '#ef4444', width: 2.8, dashed: true, label: 'load' };

    case 'contains':
      return { color: '#06b6d4', width: 2.0, dashed: false, label: 'contains' };

    case 'adjacent_to':
      return { color: '#a78bfa', width: 1.8, dashed: true, label: 'adjacent' };

    default:
      return { color: '#94a3b8', width: 1.8, dashed: false, label: 'connected' };
  }
}

export default function ConnectionEdgeLine({
  connection,
  source,
  target,
  isSelected,
  onSelect,
  onDelete,
}: Props) {
  const visual = useMemo(
    () => getRelationVisual(connection.relationType),
    [connection.relationType]
  );

  const mid: [number, number, number] = useMemo(
    () => [
      (source.position[0] + target.position[0]) / 2,
      (source.position[1] + target.position[1]) / 2 + 0.2,
      (source.position[2] + target.position[2]) / 2,
    ],
    [source.position, target.position]
  );




const handleSelectEdge = (
  e: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>
) => {
  e.stopPropagation();

  onSelect(connection.uuid);
};

  return (
    <>
      <Line
        points={[source.position, target.position]}
        color="#ffffff"
        transparent
        opacity={0.001}
        lineWidth={14}
        onPointerDown={handleSelectEdge}
        onClick={handleSelectEdge}
      />

      <Line
        points={[source.position, target.position]}
        color={isSelected ? '#fde047' : visual.color}
        lineWidth={isSelected ? visual.width + 0.8 : visual.width}
        dashed={visual.dashed}
        dashSize={0.3}
        gapSize={0.2}
        onPointerDown={handleSelectEdge}
        onClick={handleSelectEdge}
      />

      <Html position={mid} center distanceFactor={12} transform={false} occlude={false}>
        <div
          className={`${styles.edgeLabel} ${
            isSelected ? styles.edgeLabelSelected : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(connection.uuid);
          }}
          dir="rtl"
        >
          <span title={connection.relationType}>{visual.label}</span>

          {isSelected ? (
            <button
              type="button"
              className={styles.edgeDeleteButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(connection.uuid);
              }}
              aria-label="حذف اتصال"
              title="حذف اتصال"
            >
              ×
            </button>
          ) : null}
        </div>
      </Html>
    </>
  );
}
