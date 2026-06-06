// src/lib/api/workspaces.ts

import { apiClient } from '@/lib/api/axios';

import type {
  ApiEntityWorkspace,
  ApiWorkspaceBulkStatusResponse,
  ApiWorkspaceStatus,
  CreateEntityWorkspacePayload,
  FetchWorkspaceBulkStatusOptions,
  WorkspaceType,
} from '@/lib/types/workspace.types';

function buildProjectParams(projectUuid: string) {
  return {
    project: projectUuid,
  };
}

function uniqueStrings(input: string[]): string[] {
  return [...new Set(input.filter(Boolean))];
}

function chunkArray<T>(input: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [input];

  const chunks: T[][] = [];

  for (let index = 0; index < input.length; index += chunkSize) {
    chunks.push(input.slice(index, index + chunkSize));
  }

  return chunks;
}

/**
 * دریافت لیست Workspaceها.
 */
export async function fetchEntityWorkspaces(
  projectUuid: string,
  options: {
    systemEntityUuid?: string;
    workspaceType?: WorkspaceType;
  } = {}
): Promise<ApiEntityWorkspace[]> {
  if (!projectUuid) {
    throw new Error('fetchEntityWorkspaces: projectUuid is required');
  }

  const params: Record<string, string> = {
    ...buildProjectParams(projectUuid),
  };

  if (options.systemEntityUuid) {
    params.system_entity = options.systemEntityUuid;
  }

  if (options.workspaceType) {
    params.workspace_type = options.workspaceType;
  }

  const { data } = await apiClient.get('/entities/workspaces/', {
    params,
  });

  return data.results ?? data ?? [];
}

/**
 * دریافت یک Workspace.
 */
export async function fetchEntityWorkspace(
  projectUuid: string,
  workspaceUuid: string
): Promise<ApiEntityWorkspace> {
  if (!projectUuid) {
    throw new Error('fetchEntityWorkspace: projectUuid is required');
  }

  if (!workspaceUuid) {
    throw new Error('fetchEntityWorkspace: workspaceUuid is required');
  }

  const { data } = await apiClient.get(
    `/entities/workspaces/${workspaceUuid}/`,
    {
      params: buildProjectParams(projectUuid),
    }
  );

  return data;
}

/**
 * ایجاد Workspace عمومی.
 *
 * برای FEM:
 * workspace_type: 'FEM'
 *
 * برای CAD:
 * workspace_type: 'CAD'
 */
export async function createEntityWorkspace(
  projectUuid: string,
  payload: CreateEntityWorkspacePayload
): Promise<ApiEntityWorkspace> {
  if (!projectUuid) {
    throw new Error('createEntityWorkspace: projectUuid is required');
  }

  if (!payload.system_entity_uuid) {
    throw new Error('createEntityWorkspace: system_entity_uuid is required');
  }

  if (!payload.workspace_type) {
    throw new Error('createEntityWorkspace: workspace_type is required');
  }

  const body = {
    ...payload,
    project: projectUuid,
  };

  const { data } = await apiClient.post('/entities/workspaces/', body, {
    params: buildProjectParams(projectUuid),
  });

  return data;
}

/**
 * وضعیت یک Workspace برای یک SystemEntity.
 */
export async function fetchWorkspaceStatus(
  projectUuid: string,
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): Promise<ApiWorkspaceStatus> {
  if (!projectUuid) {
    throw new Error('fetchWorkspaceStatus: projectUuid is required');
  }

  if (!systemEntityUuid) {
    throw new Error('fetchWorkspaceStatus: systemEntityUuid is required');
  }

  const { data } = await apiClient.get('/entities/fem-models/status/', {
    params: {
      ...buildProjectParams(projectUuid),
      system_entity: systemEntityUuid,
      workspace_type: workspaceType,
    },
  });

  return data;
}

/**
 * وضعیت Bulk برای Canvas.
 */
export async function fetchWorkspaceBulkStatus(
  projectUuid: string,
  systemEntityUuids: string[],
  workspaceType: WorkspaceType,
  options: FetchWorkspaceBulkStatusOptions = {}
): Promise<ApiWorkspaceBulkStatusResponse> {
  if (!projectUuid) {
    throw new Error('fetchWorkspaceBulkStatus: projectUuid is required');
  }

  const uniqueUuids = uniqueStrings(systemEntityUuids);

  if (uniqueUuids.length === 0) {
    return [];
  }

  const chunks = chunkArray(uniqueUuids, 500);

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const { data } = await apiClient.post<ApiWorkspaceBulkStatusResponse>(
        '/entities/fem-models/bulk-status/',
        {
          project_uuid: projectUuid,
          system_entity_uuids: chunk,
          workspace_type: workspaceType,
          strict: options.strict ?? false,
        },
        {
          params: buildProjectParams(projectUuid),
        }
      );

      return data;
    })
  );

  return responses.flat();
}
