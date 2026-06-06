// src/components/canvas/shapes/CylinderShape.tsx

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

export default function CylinderShape({
  entity,
  isSelected,
  isEdgeSource,
  visualProps,
  materialProps,
}: EntityShapeProps) {
  const radiusTop = getNumber(visualProps?.radiusTop, 0.5);
  const radiusBottom = getNumber(visualProps?.radiusBottom, 0.5);
  const height = getNumber(visualProps?.height, 2);
  const radialSegments = Math.max(
    3,
    Math.floor(getNumber(visualProps?.radialSegments, 32))
  );

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
      <cylinderGeometry
        args={[radiusTop, radiusBottom, height, radialSegments]}
      />
      <EntityMaterial
        color={materialColor}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={materialVariant}
      />
    </mesh>
  );
}
