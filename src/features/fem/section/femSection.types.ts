// src/features/fem/section/femSection.types.ts


import type { CanvasEntity } from '@/lib/types/canvas.types';
import type { ApiEntityWorkspace } from '@/lib/types/workspace.types';

export type FemSectionKind =
  | 'rectangular'
  | 'box'
  | 'box_culvert'
  | 'circular'
  | 'cylinder'
  | 'i_shape'
  | 'unknown';

export type FemSectionUnit = 'm' | 'cm' | 'mm' | string;

export interface FemSectionMaterial {
  type?: string | null;
  grade?: string | null;
  color?: string | null;
  variant?: string | null;
}

export interface FemSectionDimensions {
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  length?: number | null;
  thickness?: number | null;
  wallThickness?: number | null;
  diameter?: number | null;
  radius?: number | null;
  flangeWidth?: number | null;
  flangeThickness?: number | null;
  webThickness?: number | null;
}

export interface FemSectionModel {
  kind: FemSectionKind;
  label: string;
  source: 'entity_metadata' | 'system_type_metadata' | 'visual_definition' | 'fallback';
  units: FemSectionUnit;
  dimensions: Required<Pick<FemSectionDimensions, 'width' | 'height'>> &
    FemSectionDimensions;
  material: FemSectionMaterial;
  raw: Record<string, unknown>;
  entity: CanvasEntity;
  workspace: ApiEntityWorkspace;
}

export interface FemSectionResolveIssue {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface FemSectionResolveResult {
  workspace: ApiEntityWorkspace | null;
  entity: CanvasEntity | null;
  section: FemSectionModel | null;
  issues: FemSectionResolveIssue[];
}

export interface FemSectionCanvasState {
  x: number;
  y: number;
  selected: boolean;
}

export interface FemSectionDraft {
  kind: FemSectionKind;
  label: string;
  units: FemSectionUnit;
  dimensions: Required<Pick<FemSectionDimensions, 'width' | 'height'>> &
    FemSectionDimensions;
  material: FemSectionMaterial;
}
