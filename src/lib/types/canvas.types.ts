// src/lib/types/canvas.types.ts

import type {
  ApiEntityType,
  ApiSystemEntityTypeSummary,
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

export interface CanvasEntity {
  id: number;
  uuid: string;

  /**
   * parentId در این پروژه در واقع UUID والد است.
   * اسم را فعلاً برای کم‌تغییر بودن کد نگه می‌داریم.
   */
  parentId: string | null;

  /**
   * UUID فرزندان.
   */
  childIds: string[];

  name: string;
  code: string;
  description: string;

  /**
   * Presentation/representation type:
   * macro / fem / environment / generic
   */
  entityType: ApiEntityType;

  /**
   * Semantic/domain type from SystemEntityType catalog.
   */
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

export interface CanvasFemLink {
  hasFemModel: boolean;
  femEligible: boolean;
  femModelUuid: string | null;
  femModelId: number | null;
}

export interface CanvasFemStatus {
  systemEntityUuid: string;
  systemEntityCode: string;
  systemEntityName: string;

  systemTypeUuid: string | null;
  systemTypeName: string | null;

  femEligible: boolean;
  hasFemModel: boolean;

  femModelUuid: string | null;
  femModelId: number | null;

  entityType: string;
}

export interface CanvasFemModel {
  id: number;
  uuid: string;

  projectUuid: string;

  systemEntityUuid: string;
  systemEntityCode: string;
  systemEntityName: string;
  systemEntityType: string;

  systemTypeUuid: string | null;
  systemTypeName: string | null;

  femEligible: boolean;

  metadata: Record<string, unknown>;
}
