// src/lib/types/api.types.ts

export type ApiEntityType =
  | 'macro'
  | 'fem'
  | 'environment'
  | 'generic'
  | string;

export type ApiMetadata = Record<string, unknown>;

export interface ApiVisualDefinition {
  renderer: string;
  bindings?: Record<string, string>;
  static_props?: Record<string, unknown>;
  material?: Record<string, unknown>;
}

export interface ApiWorkspaceSummary {
  total?: number;
  by_type?: Record<string, number>;
  available?: string[];
  [key: string]: unknown;
}

export interface ApiEntityWorkspaceSummary {
  id?: number;
  uuid?: string;
  workspace?: string;
  workspace_type?: string;
  name?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface ApiSystemEntityTypeSummary {
  id: number;
  uuid: string;

  code: string;
  name: string;
  description?: string | null;

  category: string;

  is_active: boolean;
  is_root_allowed: boolean;
  allows_children: boolean;
  fem_eligible: boolean;

  metadata_schema?: ApiMetadata;
  metadata_defaults?: ApiMetadata;
  metadata?: ApiMetadata;

  // Optional UI/renderer fields if backend summary serializer exposes them.
  domain?: string;
  icon_key?: string | null;
  shape_key?: string | null;
  color_key?: string | null;
  render_variant?: string | null;
  visual_definition?: ApiVisualDefinition | null;
  allowed_workspaces?: string[];
}

export interface ApiSystemEntityTreeChild {
  id: number;
  uuid: string;

  code: string;
  name: string;

  entity_type: ApiEntityType;
  system_type: ApiSystemEntityTypeSummary | null;

  is_active: boolean;
  is_leaf: boolean;

  sort_order: number;
}

export interface ApiSystemEntity {
  id: number;
  uuid: string;

  project: string;

  parent: string | null;
  children: ApiSystemEntityTreeChild[];

  code: string;
  name: string;
  description: string;

  entity_type: ApiEntityType;
  system_type: ApiSystemEntityTypeSummary | null;

  pos_x: number | null;
  pos_y: number | null;
  pos_z: number | null;

  sort_order: number;

  is_root: boolean;
  is_leaf: boolean;

  is_active: boolean;

  metadata: ApiMetadata;
  metadata_schema: ApiMetadata;
  metadata_defaults: ApiMetadata;
  effective_metadata: ApiMetadata;

  allowed_workspaces: string[];
  workspace_summary: ApiWorkspaceSummary;
  workspaces: ApiEntityWorkspaceSummary[];

  created_at: string;
  updated_at: string;
}

export interface ApiCreateSystemEntityPayload {
  project: string;

  parent?: string | null;

  code: string;
  name: string;
  description?: string;

  entity_type?: ApiEntityType;
  system_type_uuid?: string | null;

  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number | null;

  sort_order?: number;

  is_active?: boolean;
  metadata?: ApiMetadata;
}

export type ApiUpdateSystemEntityPayload =
  Partial<ApiCreateSystemEntityPayload>;

export interface ApiConnectionEdge {
  id: number;
  uuid?: string;

  source_entity: number | string | { id?: number; uuid?: string };
  target_entity: number | string | { id?: number; uuid?: string };

  connection_type?: string;
  relation_type?: string;

  weight?: number;
  metadata?: ApiMetadata | null;

  created_at?: string;
  updated_at?: string;
}

export interface ApiProjectGraphResponse {
  entities: ApiSystemEntity[];
  connections: ApiConnectionEdge[];
}
