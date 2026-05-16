// src/lib/api/system.ts

import { apiClient } from '@/lib/api/axios';
import type {
  ApiConnectionEdge,
  ApiProjectGraphResponse,
  ApiSystemEntity,
} from '@/lib/types/api.types';
import type { SystemEntityType } from '@/lib/api/types'; // ایمپورت تایپ جدید

type ApiContext = {
  projectUuid: string;
  scenarioId?: string;
};

export interface CreateSystemEntityPayload {
  name: string;
  code?: string;
  // entity_type: string; حذف شد
  system_type_uuid: string; // به جای entity_type اضافه شد
  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number | null;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
  parent?: string | null;
}

export interface UpdateSystemEntityPayload {
  name?: string;
  code?: string;
  // entity_type?: string; حذف شد
  system_type_uuid?: string; // به جای entity_type اضافه شد
  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number | null;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
  parent?: string | null;
}

export interface CreateConnectionPayload {
  source_entity: string;
  target_entity: string;
  relation_type?: string;
  weight?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateConnectionPayload {
  source_entity?: string;
  target_entity?: string;
  relation_type?: string;
  weight?: number;
  metadata?: Record<string, unknown> | null;
}

function buildProjectParams(projectUuid: string) {
  return {
    project: projectUuid,
  };
}

// --- تابع جدید برای دریافت لیست انواع سیستم (System Entity Types) ---
export async function fetchSystemEntityTypes(): Promise<SystemEntityType[]> {
  const { data } = await apiClient.get('/entities/system-entity-types/');
  return data.results ?? data; // بسته به اینکه Pagination بک‌اند چگونه تنظیم شده است
}
// ----------------------------------------------------------------

export async function fetchProjectGraph(
  projectUuid: string,
  _scenarioId?: string
): Promise<ApiProjectGraphResponse> {
  const params = buildProjectParams(projectUuid);

  const [entitiesRes, connectionsRes] = await Promise.all([
    apiClient.get('/entities/system-entities/', { params }),
    apiClient.get('/entities/connections/', { params }),
  ]);

  return {
    entities: entitiesRes.data?.results ?? entitiesRes.data ?? [],
    connections: connectionsRes.data?.results ?? connectionsRes.data ?? [],
  };
}

export async function createSystemEntity(
  projectUuid: string,
  payload: CreateSystemEntityPayload,
  _scenarioId?: string
): Promise<ApiSystemEntity> {
  const body = {
    ...payload,
    project: projectUuid,
  };

  const { data } = await apiClient.post('/entities/system-entities/', body, {
    params: buildProjectParams(projectUuid),
  });

  return data;
}

export async function updateSystemEntity(
  entityUuid: string,
  payload: UpdateSystemEntityPayload,
  context: ApiContext
): Promise<ApiSystemEntity> {
  const { data } = await apiClient.patch(
    `/entities/system-entities/${entityUuid}/`,
    payload,
    {
      params: buildProjectParams(context.projectUuid),
    }
  );

  return data;
}

export async function deleteSystemEntity(
  entityUuid: string,
  context: ApiContext
): Promise<void> {
  await apiClient.delete(`/entities/system-entities/${entityUuid}/`, {
    params: buildProjectParams(context.projectUuid),
  });
}

export async function createConnection(
  projectUuid: string,
  payload: CreateConnectionPayload
): Promise<ApiConnectionEdge> {
  const body = {
    ...payload,
    project: projectUuid,
  };

  const { data } = await apiClient.post('/entities/connections/', body, {
    params: buildProjectParams(projectUuid),
  });

  return data;
}

export async function updateConnection(
  connectionUuid: string,
  payload: UpdateConnectionPayload,
  context: ApiContext
): Promise<ApiConnectionEdge> {
  const { data } = await apiClient.patch(
    `/entities/connections/${connectionUuid}/`,
    payload,
    {
      params: buildProjectParams(context.projectUuid),
    }
  );

  return data;
}

export async function deleteConnection(
  connectionUuid: string,
  context: ApiContext
): Promise<void> {
  await apiClient.delete(`/entities/connections/${connectionUuid}/`, {
    params: buildProjectParams(context.projectUuid),
  });
}
