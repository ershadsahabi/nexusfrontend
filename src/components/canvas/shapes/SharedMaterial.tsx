// src/components/canvas/shapes/SharedMaterial.tsx

import React from 'react';
import { Edges } from '@react-three/drei';

interface SharedMaterialProps {
  color?: string | null;
  isSelected: boolean;
  isEdgeSource: boolean;
  variant?: string | null;
  opacity?: number;
  showEdges?: boolean;
}

function resolveBaseColor(
  color: string | null | undefined,
  isSelected: boolean,
  isEdgeSource: boolean
) {
  if (isSelected) return '#facc15';
  if (isEdgeSource) return '#a855f7';
  return color || '#94a3b8';
}

export function EntityMaterial({
  color,
  isSelected,
  isEdgeSource,
  variant,
  opacity = 1,
  showEdges = true,
}: SharedMaterialProps) {
  const finalColor = resolveBaseColor(color, isSelected, isEdgeSource);
  const isTransparent = variant === 'transparent' || opacity < 1;
  const finalOpacity = variant === 'transparent' ? 0.4 : opacity;
  const isWireframe = variant === 'wireframe';

  return (
    <>
      <meshStandardMaterial
        color={finalColor}
        emissive={finalColor}
        emissiveIntensity={isSelected ? 0.32 : isEdgeSource ? 0.18 : 0.05}
        metalness={0.08}
        roughness={0.82}
        transparent={isTransparent}
        opacity={finalOpacity}
        wireframe={isWireframe}
      />

      {showEdges && !isWireframe && (
        <Edges
          threshold={15}
          color={isSelected ? '#111827' : '#475569'}
          renderOrder={2}
        />
      )}
    </>
  );
}
