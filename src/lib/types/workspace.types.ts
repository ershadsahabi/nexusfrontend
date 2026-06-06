// src/lib/types/workspace.types.ts

export type WorkspaceType = 'FEM' | 'CAD';

export type WorkspaceTypeSlug = 'fem' | 'cad';

export type WorkspaceStatusKind =
  | 'available'
  | 'created'
  | 'not_eligible'
  | 'unknown';

export interface ApiWorkspaceSystemEntitySummary {
  id?: number;
  uuid: string;
  name: string;
  code?: string | null;

  entity_type?: string | null;

  system_type_uuid?: string | null;
  system_type_name?: string | null;
  system_type_code?: string | null;

  fem_eligible?: boolean;
  cad_eligible?: boolean;
}

export interface ApiEntityWorkspace {
  id: number;
  uuid: string;

  project: string;

  system_entity: ApiWorkspaceSystemEntitySummary;

  workspace_type: WorkspaceType;

  name?: string | null;
  code?: string | null;

  metadata?: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;

  /**
   * اگر بک‌اند مدل تخصصی را nested برگرداند.
   */
  fem_model?: {
    id: number;
    uuid: string;
  } | null;

  cad_model?: {
    id: number;
    uuid: string;
  } | null;

  /**
   * اگر بک‌اند UUID مدل تخصصی را flat بدهد.
   */
  fem_model_uuid?: string | null;
  fem_model_id?: number | null;

  cad_model_uuid?: string | null;
  cad_model_id?: number | null;
}

export interface ApiWorkspaceStatus {
  system_entity_uuid: string;
  system_entity_code?: string | null;
  system_entity_name?: string | null;

  system_type_uuid?: string | null;
  system_type_name?: string | null;
  system_type_code?: string | null;

  workspace_type: WorkspaceType;

  eligible: boolean;
  has_workspace: boolean;

  workspace_uuid?: string | null;
  workspace_id?: number | null;

  /**
   * سازگاری با خروجی‌های احتمالی FEM قدیمی/جدید
   */
  fem_eligible?: boolean;
  has_fem_model?: boolean;
  fem_model_uuid?: string | null;
  fem_model_id?: number | null;

  /**
   * سازگاری با CAD
   */
  cad_eligible?: boolean;
  has_cad_model?: boolean;
  cad_model_uuid?: string | null;
  cad_model_id?: number | null;

  entity_type?: string | null;
}

export type ApiWorkspaceBulkStatusResponse = ApiWorkspaceStatus[];

export interface CreateEntityWorkspacePayload {
  system_entity_uuid: string;
  workspace_type: WorkspaceType;
  metadata?: Record<string, unknown> | null;
}

export interface FetchWorkspaceBulkStatusOptions {
  strict?: boolean;
}

export interface CanvasWorkspaceStatus {
  systemEntityUuid: string;
  systemEntityCode?: string | null;
  systemEntityName?: string | null;

  systemTypeUuid?: string | null;
  systemTypeName?: string | null;
  systemTypeCode?: string | null;

  workspaceType: WorkspaceType;

  eligible: boolean;
  hasWorkspace: boolean;

  workspaceUuid?: string | null;
  workspaceId?: number | null;

  entityType?: string | null;
}

export interface CanvasEntityWorkspace {
  id: number;
  uuid: string;

  projectUuid: string;

  workspaceType: WorkspaceType;

  systemEntityUuid: string;
  systemEntityCode?: string | null;
  systemEntityName?: string | null;

  systemTypeUuid?: string | null;
  systemTypeName?: string | null;

  eligible?: boolean;

  metadata: Record<string, unknown>;
}

export function workspaceTypeToSlug(type: WorkspaceType): WorkspaceTypeSlug {
  return type.toLowerCase() as WorkspaceTypeSlug;
}

export function workspaceSlugToType(slug: string): WorkspaceType {
  const normalized = slug.toLowerCase();

  if (normalized === 'cad') return 'CAD';

  return 'FEM';
}

export function buildWorkspaceHref(
  projectUuid: string,
  workspaceType: WorkspaceType,
  workspaceUuid: string
): string {
  return `/projects/${projectUuid}/${workspaceTypeToSlug(
    workspaceType
  )}/${workspaceUuid}`;
}
