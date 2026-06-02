// src/components/canvas/shapes/BoxCulvertShape.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { EntityShapeProps } from './ShapeRegistry';
import { EntityMaterial } from './SharedMaterial';

type BoxCulvertMetadata = {
  width?: number;
  height?: number;
  length?: number;
  thickness?: number;
};

export default function BoxCulvertShape({
  entity,
  isSelected,
  isEdgeSource,
}: EntityShapeProps) {
  const {
    width = 2,
    height = 2,
    length = 4,
    thickness = 0.2,
  } = ((entity.metadata ?? {}) as BoxCulvertMetadata);

  const safeThickness = Math.min(thickness, width / 2 - 0.01, height / 2 - 0.01);

  const shape = useMemo(() => {
    const outer = new THREE.Shape();

    outer.moveTo(-width / 2, -height / 2);
    outer.lineTo(width / 2, -height / 2);
    outer.lineTo(width / 2, height / 2);
    outer.lineTo(-width / 2, height / 2);
    outer.lineTo(-width / 2, -height / 2);

    const innerWidth = Math.max(width - safeThickness * 2, 0.01);
    const innerHeight = Math.max(height - safeThickness * 2, 0.01);

    const hole = new THREE.Path();
    hole.moveTo(-innerWidth / 2, -innerHeight / 2);
    hole.lineTo(-innerWidth / 2, innerHeight / 2);
    hole.lineTo(innerWidth / 2, innerHeight / 2);
    hole.lineTo(innerWidth / 2, -innerHeight / 2);
    hole.lineTo(-innerWidth / 2, -innerHeight / 2);

    outer.holes.push(hole);

    return outer;
  }, [width, height, safeThickness]);

  const extrudeSettings = useMemo(
    () => ({
      steps: 1,
      depth: length,
      bevelEnabled: false,
    }),
    [length]
  );

  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, -length / 2, -height / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <EntityMaterial
        color={entity.systemType?.color_key}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={entity.render_variant}
      />
    </mesh>
  );
}
