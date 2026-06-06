// src/hooks/useWorkspaceModel.ts

'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createEntityWorkspace,
  fetchWorkspaceBulkStatus,
  fetchWorkspaceStatus,
} from '@/lib/api/workspaces';

import { useWorkspaceStatusStore } from '@/store/useWorkspaceStatusStore';

import {
  parseSystemErrors,
  type ApiErrorMap,
} from '@/lib/api/system';

import type {
  ApiWorkspaceStatus,
  CanvasWorkspaceStatus,
  EnhancedCanvasWorkspaceStatus,
  WorkspaceRuntimeState,
  WorkspaceType,
} from '@/lib/types/workspace.types';

type AnyRecord = Record<string, unknown>;

export function getWorkspaceStatusQueryKey(
  projectUuid: string,
  systemEntityUuid: string | null,
  workspaceType: WorkspaceType
) {
  return [
    'workspace-status',
    projectUuid,
    workspaceType,
    systemEntityUuid,
  ] as const;
}

export function getWorkspaceBulkStatusQueryKey(
  projectUuid: string,
  systemEntityUuids: string[],
  workspaceType: WorkspaceType
) {
  return [
    'workspace-bulk-status',
    projectUuid,
    workspaceType,
    [...systemEntityUuids].sort().join(','),
  ] as const;
}

function normalizeUuidList(input: string[]): string[] {
  return [...new Set(input.filter(Boolean))].sort();
}

function normalizeWorkspaceTypeValue(value: WorkspaceType | string): string {
  return String(value).trim().toLowerCase();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function readAllowedWorkspacesFromObject(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];

  const obj = value as AnyRecord;

  const directSnake = toStringArray(obj.allowed_workspaces);
  if (directSnake.length > 0) return directSnake;

  const directCamel = toStringArray(obj.allowedWorkspaces);
  if (directCamel.length > 0) return directCamel;

  const metadata = obj.metadata;
  if (metadata && typeof metadata === 'object') {
    const metadataObj = metadata as AnyRecord;

    const metadataSnake = toStringArray(metadataObj.allowed_workspaces);
    if (metadataSnake.length > 0) return metadataSnake;

    const metadataCamel = toStringArray(metadataObj.allowedWorkspaces);
    if (metadataCamel.length > 0) return metadataCamel;
  }

  return [];
}

function extractAllowedWorkspaces(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as AnyRecord;

  const candidates: unknown[] = [
    obj,
    obj.system_entity,
    obj.systemEntity,
    obj.system_type,
    obj.systemType,
  ];

  const systemEntity =
    obj.system_entity && typeof obj.system_entity === 'object'
      ? (obj.system_entity as AnyRecord)
      : obj.systemEntity && typeof obj.systemEntity === 'object'
        ? (obj.systemEntity as AnyRecord)
        : null;

  if (systemEntity) {
    candidates.push(systemEntity.system_type);
    candidates.push(systemEntity.systemType);
  }

  for (const candidate of candidates) {
    const allowed = readAllowedWorkspacesFromObject(candidate);
    if (allowed.length > 0) {
      return [...new Set(allowed)];
    }
  }

  return [];
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildCanvasWorkspaceStatus(
  apiStatus: ApiWorkspaceStatus,
  workspaceType: WorkspaceType
): CanvasWorkspaceStatus {
  return {
    systemEntityUuid: apiStatus.system_entity_uuid,
    systemEntityCode: apiStatus.system_entity_code ?? null,
    systemEntityName: apiStatus.system_entity_name ?? null,

    systemTypeUuid: apiStatus.system_type_uuid ?? null,
    systemTypeName: apiStatus.system_type_name ?? null,
    systemTypeCode: apiStatus.system_type_code ?? null,

    workspaceType,

    eligible: Boolean(apiStatus.eligible),
    hasWorkspace: Boolean(apiStatus.has_workspace),

    workspaceUuid: apiStatus.workspace_uuid ?? null,
    workspaceId: apiStatus.workspace_id ?? null,

    entityType: apiStatus.entity_type ?? null,
  };
}

function enhanceWorkspaceStatus(
  apiStatus: ApiWorkspaceStatus,
  workspaceType: WorkspaceType
): EnhancedCanvasWorkspaceStatus {
  const raw = apiStatus as Record<string, unknown>;
  const canvasStatus = buildCanvasWorkspaceStatus(apiStatus, workspaceType);

  const normalizedType = normalizeWorkspaceTypeValue(workspaceType);
  const allowedWorkspaces = extractAllowedWorkspaces(apiStatus);

  const typeEligible =
    workspaceType === 'FEM'
      ? getBoolean(raw.fem_eligible)
      : workspaceType === 'CAD'
        ? getBoolean(raw.cad_eligible)
        : null;

  const typeWorkspaceAllowed =
    workspaceType === 'FEM'
      ? getBoolean(raw.fem_workspace_allowed)
      : workspaceType === 'CAD'
        ? getBoolean(raw.cad_workspace_allowed)
        : null;

  const genericEligible = getBoolean(raw.eligible);

  const isAllowed =
    allowedWorkspaces.length > 0
      ? allowedWorkspaces.includes(normalizedType)
      : typeWorkspaceAllowed ?? typeEligible ?? genericEligible ?? false;

  const hasWorkspace =
    getBoolean(raw.has_workspace) ??
    (workspaceType === 'FEM' ? getBoolean(raw.has_fem_workspace) : null) ??
    (workspaceType === 'CAD' ? getBoolean(raw.has_cad_workspace) : null) ??
    Boolean(raw.workspace_uuid);

  const hasModel =
    getBoolean(raw.has_model) ??
    (workspaceType === 'FEM' ? getBoolean(raw.has_fem_model) : null) ??
    (workspaceType === 'CAD' ? getBoolean(raw.has_cad_model) : null) ??
    false;

  const workspaceUuid =
    getString(raw.workspace_uuid) ??
    canvasStatus.workspaceUuid ??
    null;

  const workspaceId =
    getNumber(raw.workspace_id) ??
    canvasStatus.workspaceId ??
    null;

  const modelUuid =
    getString(raw.model_uuid) ??
    (workspaceType === 'FEM'
      ? getString(raw.fem_model_uuid)
      : workspaceType === 'CAD'
        ? getString(raw.cad_model_uuid)
        : null) ??
    null;

  const modelId =
    getNumber(raw.model_id) ??
    (workspaceType === 'FEM'
      ? getNumber(raw.fem_model_id)
      : workspaceType === 'CAD'
        ? getNumber(raw.cad_model_id)
        : null) ??
    null;

  const status: WorkspaceRuntimeState = !isAllowed
    ? 'not_allowed'
    : hasWorkspace
      ? 'ready'
      : 'creatable';

  return {
    ...canvasStatus,
    eligible: isAllowed,
    hasWorkspace,
    workspaceUuid,
    workspaceId,
    allowedWorkspaces,
    isAllowed,
    status,
    hasModel,
    modelUuid,
    modelId,
  };
}

export function useWorkspaceStatus(
  projectUuid: string,
  systemEntityUuid: string | null,
  workspaceType: WorkspaceType
) {
  const setOne = useWorkspaceStatusStore((state) => state.setOne);

  const query = useQuery({
    queryKey: getWorkspaceStatusQueryKey(
      projectUuid,
      systemEntityUuid,
      workspaceType
    ),
    queryFn: async (): Promise<EnhancedCanvasWorkspaceStatus> => {
      if (!systemEntityUuid) {
        throw new Error('systemEntityUuid is required');
      }

      const apiStatus = await fetchWorkspaceStatus(
        projectUuid,
        systemEntityUuid,
        workspaceType
      );

      return enhanceWorkspaceStatus(apiStatus, workspaceType);
    },
    enabled: Boolean(projectUuid && systemEntityUuid && workspaceType),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setOne(query.data);
    }
  }, [query.data, setOne]);

  const derived = useMemo(() => {
    const status = query.data ?? null;

    return {
      status,
      canCreate: Boolean(
        status?.status === 'creatable' &&
          !query.isLoading &&
          !query.isError
      ),
      canOpen: Boolean(
        status?.status === 'ready' &&
          status?.workspaceUuid
      ),
      isLinked: Boolean(status?.status === 'ready'),
      isEligible: Boolean(status?.isAllowed),
      isCreatable: Boolean(status?.status === 'creatable'),
      isReady: Boolean(status?.status === 'ready'),
      isNotAllowed: Boolean(status?.status === 'not_allowed'),
    };
  }, [query.data, query.isLoading, query.isError]);

  return {
    ...query,
    ...derived,
  };
}

export function useWorkspaceBulkStatus(
  projectUuid: string,
  systemEntityUuids: string[],
  workspaceType: WorkspaceType
) {
  const setMany = useWorkspaceStatusStore((state) => state.setMany);

  const stableUuids = useMemo(() => {
    return normalizeUuidList(systemEntityUuids);
  }, [systemEntityUuids]);

  const query = useQuery({
    queryKey: getWorkspaceBulkStatusQueryKey(
      projectUuid,
      stableUuids,
      workspaceType
    ),
    queryFn: async (): Promise<EnhancedCanvasWorkspaceStatus[]> => {
      const data = await fetchWorkspaceBulkStatus(
        projectUuid,
        stableUuids,
        workspaceType,
        {
          strict: false,
        }
      );

      return data.map((item) => enhanceWorkspaceStatus(item, workspaceType));
    },
    enabled: Boolean(projectUuid && stableUuids.length > 0 && workspaceType),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setMany(query.data);
    }
  }, [query.data, setMany]);

  return query;
}

export function useCreateWorkspace(projectUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemEntityUuid,
      workspaceType,
      name,
      metadata,
    }: {
      systemEntityUuid: string;
      workspaceType: WorkspaceType;
      name: string;
      metadata?: Record<string, unknown>;
    }) => {
      return createEntityWorkspace(projectUuid, {
        system_entity_uuid: systemEntityUuid,
        workspace_type: workspaceType,
        name,
        metadata: metadata ?? {},
      });
    },

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWorkspaceStatusQueryKey(
            projectUuid,
            variables.systemEntityUuid,
            variables.workspaceType
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'workspace-bulk-status',
            projectUuid,
            variables.workspaceType,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ['project-graph', projectUuid],
        }),
        queryClient.invalidateQueries({
          queryKey: ['entity-workspaces', projectUuid],
        }),
      ]);
    },

    meta: {
      parseError: (error: unknown): ApiErrorMap => parseSystemErrors(error),
    },
  });
}
