// src/lib/types/api.types.ts

export type ApiEntityType =
  | 'macro'
  | 'fem'
  | 'environment'
  | 'generic'
  | string;

export interface ApiSystemEntityTypeSummary {
  uuid: string;
  code: string;
  name: string;
  domain: string;
  category: string;
  fem_eligible: boolean;
  is_root_allowed: boolean;
  allows_children: boolean;
  icon_key?: string;
  shape_key?: string;
  color_key?: string;
  render_variant?: string;
  is_active: boolean;
}

export interface ApiSystemEntityTreeChild {
  id: number;
  uuid: string;
  code: string;
  name: string;
  entity_type: ApiEntityType;
  system_type: ApiSystemEntityTypeSummary | null;
  sort_order: number;
}

export interface ApiSystemEntity {
  id: number;
  uuid: string;

  project?: string;

  parent: string | null;
  children: ApiSystemEntityTreeChild[];

  code: string;
  name: string;
  description?: string;

  entity_type: ApiEntityType;
  system_type: ApiSystemEntityTypeSummary | null;

  pos_x: number;
  pos_y: number;
  pos_z: number;

  sort_order: number;

  is_active: boolean;
  metadata?: Record<string, unknown> | null;

  is_root?: boolean;
  is_leaf?: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface ApiConnectionEdge {
  id: number;
  uuid?: string;

  source_entity: number;
  target_entity: number;

  connection_type?: string;
  relation_type?: string;

  weight?: number;
  metadata?: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;
}

export interface ApiProjectGraphResponse {
  entities: ApiSystemEntity[];
  connections: ApiConnectionEdge[];
}

export interface ApiFemSystemEntitySummary {
  uuid: string;
  code: string;
  name: string;
  entity_type: string;
  system_type_uuid: string | null;
  system_type_name: string | null;
  fem_eligible: boolean;
}

export interface ApiFemModel {
  id: number;
  uuid: string;
  project: string;
  system_entity: ApiFemSystemEntitySummary;
  metadata?: Record<string, unknown> | null;
}

export interface ApiFemStatus {
  system_entity_uuid: string;
  system_entity_code: string;
  system_entity_name: string;

  system_type_uuid: string | null;
  system_type_name: string | null;

  fem_eligible: boolean;
  has_fem_model: boolean;

  fem_model_uuid: string | null;
  fem_model_id: number | null;

  entity_type: string;
}

export interface ApiFemBulkStatusRequest {
  project_uuid?: string;
  system_entity_uuids: string[];
  strict?: boolean;
}

export type ApiFemBulkStatusResponse = ApiFemStatus[];
