// src/lib/api/types.ts

import type { components } from './schema';
export type { TokenResponse, LoginCredentials, UserProfile } from './types/auth';

// ==========================================
// OpenAPI schema root
// ==========================================
export type Schemas = components['schemas'];

// ==========================================
// Core project models
// ==========================================
export type Project = Schemas['Project'];
export type PaginatedProjectList = Schemas['PaginatedProjectList'];
export type ProjectRequest = Project;

// ==========================================
// Scenario models
// ==========================================
export type Scenario = Schemas['Scenario'];
export type PaginatedScenarioList = Schemas['PaginatedScenarioList'];
export type ScenarioRequest = Scenario;

// ==========================================
// Entity models
// ==========================================
export type EntityNode = Schemas['EntityNode'];
export type PaginatedEntityNodeList = Schemas['PaginatedEntityNodeList'];
export type Assembly = Schemas['Assembly'];

// --- اضافه شده: مدل‌های مربوط به SystemEntityType ---
export interface SystemEntityTypeSummary {
  id: number;
  uuid: string;
  name: string;
  code: string;
  category: string;
  fem_eligible: boolean;
}

export interface SystemEntityType extends SystemEntityTypeSummary {
  description: string | null;
  is_root_allowed: boolean;
  can_have_children: boolean;
  metadata_schema: Record<string, unknown> | null;
}

export interface PaginatedSystemEntityTypeList {
  count: number;
  next: string | null;
  previous: string | null;
  results: SystemEntityType[];
}
// ---------------------------------------------------

export type RelationType =
  | 'connected_to'
  | 'supports'
  | 'transfers_load_to'
  | 'adjacent_to'
  | 'contains';

export interface SystemEntity {
  id: number;
  uuid: string;
  project: string;
  scenario?: string | null;
  name: string;
  code?: string | null;
  // entity_type حذف شد و system_type جایگزین شد (طبق بک‌اند)
  system_type: SystemEntityTypeSummary; 
  pos_x: number;
  pos_y: number;
  pos_z: number;
}

export interface ConnectionEdge {
  id: number;
  uuid: string;
  project: string;
  scenario?: string | null;
  source_entity: number;
  target_entity: number;
  relation_type: RelationType;
}

export interface PaginatedSystemEntityList {
  count: number;
  next: string | null;
  previous: string | null;
  results: SystemEntity[];
}

export interface PaginatedConnectionEdgeList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConnectionEdge[];
}

// ==========================================
// Request compatibility aliases
// ==========================================
export type SystemEntityRequest = SystemEntity;
export type PatchedSystemEntityRequest = Partial<SystemEntity>;

export type ConnectionEdgeRequest = ConnectionEdge;
export type PatchedConnectionEdgeRequest = Partial<ConnectionEdge>;
