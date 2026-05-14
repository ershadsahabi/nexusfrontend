// src/lib/types/api.types.ts

export type ApiEntityType = 'macro' | 'fem' | 'environment' | 'generic' | string;

export interface ApiSystemEntity {
  id: number;
  uuid: string;

  parent: string | null;
  children: string[];


  code: string;
  name: string;

  entity_type: ApiEntityType;

  pos_x: number;
  pos_y: number;
  pos_z: number;

  sort_order: number;

  metadata?: Record<string, unknown>;

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

  metadata?: Record<string, unknown>;

  created_at?: string;
  updated_at?: string;
}

export interface ApiProjectGraphResponse {
  entities: ApiSystemEntity[];
  connections: ApiConnectionEdge[];
}
