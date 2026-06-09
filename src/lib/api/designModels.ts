// src/lib/api/designModels.ts

import { apiClient } from '@/lib/api/axios';

import {
  normalizeWorkspaceType,
  workspaceTypeToSlug,
  type WorkspaceType,
} from '@/lib/types/workspace.types';

export type CreateDesignModelPayload = {
  project_uuid: string;
  workspace_uuid: string;
  system_entity_uuid: string;
  workspace_type: WorkspaceType;
  code: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

export type ApiDesignModel = {
  id: number;
  uuid: string;
  project?: number | string;
  workspace?: number | null;
  workspace_uuid?: string | null;
  system_entity?: number | null;
  system_entity_uuid?: string | null;
  workspace_type?: string | null;
  code?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

function buildProjectParams(projectUuid: string) {
  return {
    project: projectUuid,
  };
}

function parseAxiosError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    const response = error.response as {
      data?: unknown;
      status?: number;
    };

    const data = response.data;

    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;

      if (typeof record.detail === 'string') {
        return record.detail;
      }

      const firstKey = Object.keys(record)[0];
      if (firstKey) {
        const value = record[firstKey];

        if (Array.isArray(value)) {
          return `${firstKey}: ${value.join(' ')}`;
        }

        if (value && typeof value === 'object') {
          return `${firstKey}: ${JSON.stringify(value)}`;
        }

        return `${firstKey}: ${String(value)}`;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'خطای نامشخص در ایجاد Design Model.';
}

export async function createDesignModel(
  payload: CreateDesignModelPayload
): Promise<ApiDesignModel> {
  if (!payload.project_uuid) {
    throw new Error('createDesignModel: project_uuid is required');
  }

  if (!payload.workspace_uuid) {
    throw new Error('createDesignModel: workspace_uuid is required');
  }

  if (!payload.system_entity_uuid) {
    throw new Error('createDesignModel: system_entity_uuid is required');
  }

  if (!payload.workspace_type) {
    throw new Error('createDesignModel: workspace_type is required');
  }

  const safeCode = String(payload.code ?? '').trim();
  if (!safeCode) {
    throw new Error('createDesignModel: code is required');
  }

  const normalizedWorkspaceType = normalizeWorkspaceType(payload.workspace_type);
  const safeName = String(payload.name ?? '').trim();

  const body = {
    project_uuid: payload.project_uuid,
    workspace_uuid: payload.workspace_uuid,
    system_entity_uuid: payload.system_entity_uuid,
    workspace_type: workspaceTypeToSlug(normalizedWorkspaceType),
    code: safeCode,
    name: safeName || undefined,
    metadata: payload.metadata ?? {},
  };

  try {
    const { data } = await apiClient.post<ApiDesignModel>(
      '/design/models/',
      body,
      {
        params: buildProjectParams(payload.project_uuid),
      }
    );

    return data;
  } catch (error) {
    throw new Error(parseAxiosError(error));
  }
}
