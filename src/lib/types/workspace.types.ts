// src/lib/types/workspace.types.ts


export type WorkspaceType = 'FEM' | 'CAD';

export type WorkspaceTypeSlug = 'fem' | 'cad';

export type WorkspaceStatusKind =
  | 'available'
  | 'created'
  | 'not_eligible'
  | 'unknown';

export type WorkspaceRuntimeState = 'not_allowed' | 'creatable' | 'ready';

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

  system_type?: {
    uuid?: string | null;
    name?: string | null;
    code?: string | null;
    metadata?: Record<string, unknown> | null;
    fem_eligible?: boolean;
    cad_eligible?: boolean;
    allowed_workspaces?: string[] | null;
    allowedWorkspaces?: string[] | null;
  } | null;

  metadata?: Record<string, unknown> | null;
  allowed_workspaces?: string[] | null;
  allowedWorkspaces?: string[] | null;
}

export interface ApiEntityWorkspace {
  id: number;
  uuid: string;

  project: string;

  system_entity: string;
  system_entity_code?: string | null;
  system_entity_name?: string | null;

  workspace_type: WorkspaceTypeSlug;

  name?: string | null;
  description?: string | null;

  coordinate_system?: string | null;
  coordinate_system_name?: string | null;

  origin_x?: number | null;
  origin_y?: number | null;
  origin_z?: number | null;

  rotation_x_deg?: number | null;
  rotation_y_deg?: number | null;
  rotation_z_deg?: number | null;

  has_fem_model?: boolean;
  has_cad_model?: boolean;

  is_active?: boolean;
  metadata?: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;
}


export interface ApiWorkspaceStatus {
  system_entity_uuid: string;
  system_entity_code?: string | null;
  system_entity_name?: string | null;

  system_type_uuid?: string | null;
  system_type_name?: string | null;
  system_type_code?: string | null;

  workspace_type?: WorkspaceType | WorkspaceTypeSlug;

  eligible?: boolean;
  has_workspace?: boolean;
  has_model?: boolean;

  workspace_uuid?: string | null;
  workspace_id?: number | null;

  model_uuid?: string | null;
  model_id?: number | null;

  fem_eligible?: boolean;
  fem_workspace_allowed?: boolean;
  has_fem_workspace?: boolean;
  has_fem_model?: boolean;
  fem_model_uuid?: string | null;
  fem_model_id?: number | null;

  cad_eligible?: boolean;
  cad_workspace_allowed?: boolean;
  has_cad_workspace?: boolean;
  has_cad_model?: boolean;
  cad_model_uuid?: string | null;
  cad_model_id?: number | null;

  allowed_workspaces?: string[];
  allowedWorkspaces?: string[];

  system_entity?: Record<string, unknown> | null;
  systemEntity?: Record<string, unknown> | null;

  system_type?: Record<string, unknown> | null;
  systemType?: Record<string, unknown> | null;

  metadata?: Record<string, unknown> | null;

  entity_type?: string | null;
}

export type ApiWorkspaceBulkStatusResponse = ApiWorkspaceStatus[];

export interface CreateEntityWorkspacePayload {
  system_entity_uuid: string;
  workspace_type: WorkspaceType;
  name: string;
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

export interface EnhancedCanvasWorkspaceStatus extends CanvasWorkspaceStatus {
  status: WorkspaceRuntimeState;
  allowedWorkspaces: string[];
  isAllowed: boolean;
  hasModel: boolean;
  modelUuid?: string | null;
  modelId?: number | null;
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
  if (type === 'FEM') return 'fem';
  return 'cad';
}


export function workspaceSlugToType(slug: string): WorkspaceType {
  const normalized = String(slug).trim().toLowerCase();

  if (normalized === 'fem') return 'FEM';
  if (normalized === 'cad') return 'CAD';

  throw new Error(`Invalid workspace slug: ${slug}`);
}

export function normalizeWorkspaceType(
  value: string | WorkspaceType
): WorkspaceType {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === 'fem') return 'FEM';
  if (normalized === 'cad') return 'CAD';

  throw new Error(`Invalid workspace type: ${value}`);
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
