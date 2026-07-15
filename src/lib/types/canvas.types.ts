// src/lib/types/canvas.types.ts

import type {
  ApiEntityType,
  ApiSystemEntityTypeSummary,
  ApiVisualDefinition,
} from '@/lib/types/api.types';

export type CanvasMode = 'select' | 'create-edge';

export type RelationType =
  | 'connected_to'
  | 'supports'
  | 'transfers_load_to'
  | 'contains'
  | 'adjacent_to'
  | string;

export type SystemEntityTypeSummary = ApiSystemEntityTypeSummary;

export interface ResolvedEntityVisual {
  renderer: string;
  props: Record<string, unknown>;
  material: Record<string, unknown>;
}

export interface CanvasEntity {
  uuid: string;

  parentUuid: string | null;
  childrenUuids: string[];

  name: string;
  code: string;
  description: string;

  entityType: ApiEntityType;

  systemTypeUuid: string | null;
  systemTypeCode: string | null;
  systemTypeName: string | null;

  systemType: SystemEntityTypeSummary | null;
  visualDefinition: ApiVisualDefinition | null;
  renderVariant: string | null;
  colorKey: string | null;
  shapeKey: string | null;

  position: [number, number, number];

  sortOrder: number;
  isActive: boolean;

  metadata: Record<string, unknown>;
  effectiveMetadata: Record<string, unknown>;

  isRoot: boolean;
  isLeaf: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasConnection {
  uuid: string;
  sourceUuid: string;
  targetUuid: string;

  relationType: RelationType;
  metadata: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasGraph {
  entities: CanvasEntity[];
  connections: CanvasConnection[];
}

export type EntityVisualDefinition = ApiVisualDefinition;
