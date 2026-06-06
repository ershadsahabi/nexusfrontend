// src/components/canvas/shapes/BoxShape.tsx

import React from 'react';
import type { EntityShapeProps } from './ShapeRegistry';
import { EntityMaterial } from './SharedMaterial';

function getNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export default function BoxShape({
  entity,
  isSelected,
  isEdgeSource,
  visualProps,
  materialProps,
}: EntityShapeProps) {
  const width = getNumber(visualProps?.width, 1);
  const height = getNumber(visualProps?.height, 1);
  const depth = getNumber(visualProps?.depth, 1);

  const materialColor =
    typeof materialProps?.color === 'string' && materialProps.color.trim()
      ? materialProps.color
      : entity.systemType?.color_key;

  const materialVariant =
    typeof materialProps?.variant === 'string' && materialProps.variant.trim()
      ? materialProps.variant
      : entity.systemType?.render_variant ?? entity.render_variant;

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, depth, height]} />
      <EntityMaterial
        color={materialColor}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={materialVariant}
      />
    </mesh>
  );
}
