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
  id: number;
  uuid: string;

  parentId: string | null;
  childIds: string[];

  name: string;
  code: string;
  description: string;

  entityType: ApiEntityType;
  systemType: SystemEntityTypeSummary | null;

  position: [number, number, number];

  sortOrder: number;

  isActive: boolean;

  metadata: Record<string, unknown>;

  isRoot: boolean;
  isLeaf: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasConnection {
  id: number;
  uuid: string;

  sourceId: number;
  targetId: number;

  sourceUuid: string;
  targetUuid: string;

  relationType: RelationType;

  metadata: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;
}

export type EntityVisualDefinition = ApiVisualDefinition;
