// src/components/canvas/shapes/ShapeRegistry.tsx

import React, { lazy, Suspense } from 'react';
import type { CanvasEntity } from '@/lib/types/canvas.types';

export interface EntityShapeProps {
  entity: CanvasEntity;
  isSelected: boolean;
  isEdgeSource: boolean;
}

const BoxShape = lazy(() => import('./BoxShape'));
const BoxCulvertShape = lazy(() => import('./BoxCulvertShape'));
const CylinderShape = lazy(() => import('./CylinderShape'));

const SHAPE_MAP: Record<string, React.ComponentType<EntityShapeProps>> = {
  box: BoxShape,
  'box-culvert': BoxCulvertShape,
  cylinder: CylinderShape,
};

type RendererProps = EntityShapeProps & {
  shapeKey?: string | null;
};

export function EntityShapeRenderer({
  shapeKey,
  ...props
}: RendererProps) {
  const normalizedKey = (shapeKey ?? 'box').toLowerCase().trim();
  const ShapeComponent = SHAPE_MAP[normalizedKey] ?? BoxShape;

  return (
    <Suspense fallback={<BoxShape {...props} />}>
      <ShapeComponent {...props} />
    </Suspense>
  );
}
