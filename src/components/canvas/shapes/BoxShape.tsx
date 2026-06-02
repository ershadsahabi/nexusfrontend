// src/components/canvas/shapes/BoxShape.tsx

import React from 'react';
import type { EntityShapeProps } from './ShapeRegistry';
import { EntityMaterial } from './SharedMaterial';

type BoxMetadata = {
  width?: number;
  height?: number;
  depth?: number;
};

export default function BoxShape({
  entity,
  isSelected,
  isEdgeSource,
}: EntityShapeProps) {
  const { width = 1, height = 1, depth = 1 } =
    ((entity.metadata ?? {}) as BoxMetadata);

  return (
    <mesh castShadow receiveShadow>
      {/* X, Y, Z => width, depth, height */}
      <boxGeometry args={[width, depth, height]} />
      <EntityMaterial
        color={entity.systemType?.color_key}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={entity.render_variant}
      />
    </mesh>
  );
}
