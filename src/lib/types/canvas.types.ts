// src/lib/types/canvas.types.ts

// اضافه کردن ایمپورت برای تایپ خلاصه سیستم
import type { SystemEntityTypeSummary } from '@/lib/api/types';

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

  // entityType حذف شد و با systemType جایگزین شد
  systemType: SystemEntityTypeSummary;

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
