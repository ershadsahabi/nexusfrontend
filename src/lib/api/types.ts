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

/**
 * OpenAPI generator معمولاً ProjectRequest جدا تولید نمی‌کند.
 * برای سازگاری با فرانت فعلی، alias می‌دهیم.
 */
export type ProjectRequest = Project;

// ==========================================
// Scenario models
// ==========================================

export type Scenario = Schemas['Scenario'];
export type PaginatedScenarioList = Schemas['PaginatedScenarioList'];

/**
 * OpenAPI generator معمولاً ScenarioRequest جدا تولید نمی‌کند.
 * برای سازگاری با فرانت فعلی، alias می‌دهیم.
 */
export type ScenarioRequest = Scenario;

// ==========================================
// Entity models
// نکته:
/// اگر schema شما این مدل‌ها را داشته باشد از آن‌ها استفاده می‌کنیم.
/// اگر نام واقعی در schema فرق دارد، باید با نام واقعی schema هماهنگ شود.
/// ==========================================

export type EntityNode = Schemas['EntityNode'];
export type PaginatedEntityNodeList = Schemas['PaginatedEntityNodeList'];
export type Assembly = Schemas['Assembly'];

/**
 * چون در خطاها مشخص است schema فعلی شما تایپ‌هایی مثل
 * SystemEntity / ConnectionEdge / PaginatedSystemEntityList / PaginatedConnectionEdgeList
 * را export نکرده یا نامشان متفاوت است،
 * فعلاً برای پایداری فرانت این‌ها را دستی نگه می‌داریم.
 */

export type EntityType = 'macro' | 'fem' | 'environment' | 'generic';

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
  entity_type: EntityType;
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
