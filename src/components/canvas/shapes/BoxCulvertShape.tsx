// src/components/canvas/shapes/BoxCulvertShape.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
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

export default function BoxCulvertShape({
  entity,
  isSelected,
  isEdgeSource,
  visualProps,
  materialProps,
}: EntityShapeProps) {
  const width = getNumber(visualProps?.width, 2);
  const height = getNumber(visualProps?.height, 2);
  const length = getNumber(visualProps?.length, 4);
  const thickness = getNumber(visualProps?.thickness, 0.2);

  const safeThickness = Math.max(
    0.01,
    Math.min(thickness, width / 2 - 0.01, height / 2 - 0.01)
  );

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

  const materialColor =
    typeof materialProps?.color === 'string' && materialProps.color.trim()
      ? materialProps.color
      : entity.systemType?.color_key;

  const materialVariant =
    typeof materialProps?.variant === 'string' && materialProps.variant.trim()
      ? materialProps.variant
      : entity.systemType?.render_variant ?? entity.render_variant;

  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, -length / 2, -height / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <EntityMaterial
        color={materialColor}
        isSelected={isSelected}
        isEdgeSource={isEdgeSource}
        variant={materialVariant}
      />
    </mesh>
  );
}
