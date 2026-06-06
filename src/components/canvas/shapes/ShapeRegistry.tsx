// src/components/canvas/shapes/ShapeRegistry.tsx

import React, { lazy, Suspense, useMemo } from 'react';
import type { CanvasEntity } from '@/lib/types/canvas.types';

export interface EntityShapeProps {
  entity: CanvasEntity;
  isSelected: boolean;
  isEdgeSource: boolean;
  visualProps?: Record<string, unknown>;
  materialProps?: Record<string, unknown>;
}

const BoxShape = lazy(() => import('./BoxShape'));
const BoxCulvertShape = lazy(() => import('./BoxCulvertShape'));
const CylinderShape = lazy(() => import('./CylinderShape'));

const SHAPE_MAP: Record<string, React.ComponentType<EntityShapeProps>> = {
  box: BoxShape,
  'box-culvert': BoxCulvertShape,
  box_culvert: BoxCulvertShape,
  cylinder: CylinderShape,
};

function normalizeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function getSystemTypeField(
  systemType: unknown,
  snakeKey: string,
  camelKey: string
): unknown {
  const raw = normalizeObject(systemType);
  return raw[snakeKey] ?? raw[camelKey];
}

function getVisualDefinition(systemType: unknown): Record<string, unknown> {
  return normalizeObject(
    getSystemTypeField(systemType, 'visual_definition', 'visualDefinition')
  );
}

function getShapeKey(systemType: unknown, visualDefinition: Record<string, unknown>) {
  const renderer = visualDefinition.renderer;

  if (typeof renderer === 'string' && renderer.trim()) {
    return renderer.trim().toLowerCase();
  }

  const shapeKey =
    getSystemTypeField(systemType, 'shape_key', 'shapeKey') ??
    getSystemTypeField(systemType, 'shape', 'shape');

  if (typeof shapeKey === 'string' && shapeKey.trim()) {
    return shapeKey.trim().toLowerCase();
  }

  return 'box';
}

function getMaterialProps(visualDefinition: Record<string, unknown>) {
  return normalizeObject(visualDefinition.material);
}

function getEffectiveMetadata(entity: CanvasEntity): Record<string, unknown> {
  const raw = entity as any;

  return {
    ...normalizeObject(raw.effective_metadata),
    ...normalizeObject(raw.effectiveMetadata),
    ...normalizeObject(entity.metadata),
  };
}

function resolveVisualProps(entity: CanvasEntity): {
  shapeKey: string;
  visualProps: Record<string, unknown>;
  materialProps: Record<string, unknown>;
} {
  const systemType = entity.systemType;
  const visualDefinition = getVisualDefinition(systemType);
  const shapeKey = getShapeKey(systemType, visualDefinition);

  const metadata = getEffectiveMetadata(entity);

  const bindings = normalizeObject(visualDefinition.bindings);
  const staticProps = normalizeObject(
    visualDefinition.static_props ?? visualDefinition.staticProps
  );

  const materialProps = getMaterialProps(visualDefinition);

  const resolvedProps: Record<string, unknown> = {
    ...staticProps,
  };

  for (const [propName, metadataField] of Object.entries(bindings)) {
    if (typeof metadataField !== 'string' || !metadataField.trim()) continue;

    resolvedProps[propName] = metadata[metadataField];
  }

  /**
   * Backward/alias support
   * قبلاً برای آبرو depth و wallThickness استفاده شده بود،
   * ولی کامپوننت BoxCulvertShape مقدارهای length و thickness می‌خواهد.
   */
  if (resolvedProps.length === undefined && resolvedProps.depth !== undefined) {
    resolvedProps.length = resolvedProps.depth;
  }

  if (
    resolvedProps.thickness === undefined &&
    resolvedProps.wallThickness !== undefined
  ) {
    resolvedProps.thickness = resolvedProps.wallThickness;
  }

  if (
    resolvedProps.depth === undefined &&
    resolvedProps.length !== undefined
  ) {
    resolvedProps.depth = resolvedProps.length;
  }

  if (shapeKey === 'box') {
    resolvedProps.width = normalizeNumber(resolvedProps.width, 1);
    resolvedProps.height = normalizeNumber(resolvedProps.height, 1);
    resolvedProps.depth = normalizeNumber(resolvedProps.depth, 1);
  }

  if (shapeKey === 'box-culvert' || shapeKey === 'box_culvert') {
    resolvedProps.width = normalizeNumber(resolvedProps.width, 2);
    resolvedProps.height = normalizeNumber(resolvedProps.height, 2);
    resolvedProps.length = normalizeNumber(resolvedProps.length, 4);
    resolvedProps.thickness = normalizeNumber(resolvedProps.thickness, 0.2);
  }

  if (shapeKey === 'cylinder') {
    resolvedProps.radiusTop = normalizeNumber(
      resolvedProps.radiusTop ?? resolvedProps.radius,
      0.5
    );

    resolvedProps.radiusBottom = normalizeNumber(
      resolvedProps.radiusBottom ?? resolvedProps.radius,
      0.5
    );

    resolvedProps.height = normalizeNumber(resolvedProps.height, 2);

    resolvedProps.radialSegments = Math.max(
      3,
      Math.floor(normalizeNumber(resolvedProps.radialSegments, 32))
    );
  }

  return {
    shapeKey,
    visualProps: resolvedProps,
    materialProps,
  };
}

type RendererProps = {
  entity: CanvasEntity;
  isSelected: boolean;
  isEdgeSource: boolean;
};

export function EntityShapeRenderer(props: RendererProps) {
  const resolved = useMemo(() => {
    return resolveVisualProps(props.entity);
  }, [props.entity]);

  const ShapeComponent = SHAPE_MAP[resolved.shapeKey] ?? BoxShape;

  return (
    <Suspense
      fallback={
        <BoxShape
          {...props}
          visualProps={resolved.visualProps}
          materialProps={resolved.materialProps}
        />
      }
    >
      <ShapeComponent
        {...props}
        visualProps={resolved.visualProps}
        materialProps={resolved.materialProps}
      />
    </Suspense>
  );
}
