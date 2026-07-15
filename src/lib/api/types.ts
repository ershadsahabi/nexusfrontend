// src/lib/api/types.ts

import type { components } from './schema';

import type {
  ApiConnectionEdge,
  ApiCreateSystemEntityPayload,
  ApiProjectGraphResponse,
  ApiSystemEntity,
  ApiSystemEntityTypeSummary,
  ApiUpdateSystemEntityPayload,
} from '@/lib/types/api.types';

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

// ==========================================
// System entity API contract
// ==========================================
export type SystemEntityTypeSummary = ApiSystemEntityTypeSummary;
export type SystemEntityType = ApiSystemEntityTypeSummary;
export type SystemEntity = ApiSystemEntity;
export type ConnectionEdge = ApiConnectionEdge;
export type ProjectGraphResponse = ApiProjectGraphResponse;

export interface PaginatedSystemEntityTypeList {
  count: number;
  next: string | null;
  previous: string | null;
  results: SystemEntityType[];
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

export type RelationType =
  | 'connected_to'
  | 'supports'
  | 'transfers_load_to'
  | 'adjacent_to'
  | 'contains'
  | string;

// ==========================================
// Request compatibility aliases
// ==========================================
export type SystemEntityRequest = ApiCreateSystemEntityPayload;
export type PatchedSystemEntityRequest = ApiUpdateSystemEntityPayload;

export type ConnectionEdgeRequest = ConnectionEdge;
export type PatchedConnectionEdgeRequest = Partial<ConnectionEdge>;
