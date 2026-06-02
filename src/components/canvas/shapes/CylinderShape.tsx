// src/components/canvas/shapes/CylinderShape.tsx

import React from 'react';
import type { EntityShapeProps } from './ShapeRegistry';
import { EntityMaterial } from './SharedMaterial';

type CylinderMetadata = {
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
};

export default function CylinderShape({
  entity,
  isSelected,
  isEdgeSource,
}: EntityShapeProps) {
  const {
    radiusTop = 0.5,
    radiusBottom = 0.5,
    height = 2,
    radialSegments = 32,
  } = ((entity.metadata ?? {}) as CylinderMetadata);

  return (
    <mesh castShadow receiveShadow>
      <cylinderGeometry
        args={[radiusTop, radiusBottom, height, radialSegments]}
      />
      <EntityMaterial
        color={entity.systemType?.color_key}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={entity.render_variant}
      />
    </mesh>
  );
}
