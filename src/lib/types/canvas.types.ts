// src/lib/types/canvas.types.ts

export type EntityType = 'macro' | 'fem' | 'environment' | 'generic';

export type CanvasMode = 'select' | 'create-edge';

export type RelationType =
  | 'connected_to'
  | 'supports'
  | 'transfers_load_to'
  | 'contains'
  | 'adjacent_to'
  | string;

export interface CanvasEntity {
  id: number;
  uuid: string;

  parentId: number | null;
  childIds: number[];

  name: string;
  code: string;

  entityType: EntityType;

  position: [number, number, number];

  sortOrder: number;

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
