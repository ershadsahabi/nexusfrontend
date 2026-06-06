// src/hooks/useWorkspaceModel.ts

'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createEntityWorkspace,
  fetchWorkspaceBulkStatus,
  fetchWorkspaceStatus,
} from '@/lib/api/workspaces';

import {
  mapApiWorkspaceStatusToCanvas,
  mapApiWorkspaceStatusesToCanvas,
} from '@/lib/mappers/workspace';

import { useWorkspaceStatusStore } from '@/store/useWorkspaceStatusStore';

import {
  parseSystemErrors,
  type ApiErrorMap,
} from '@/lib/api/system';

import type {
  WorkspaceType,
} from '@/lib/types/workspace.types';

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
    queryFn: async () => {
      if (!systemEntityUuid) {
        throw new Error('systemEntityUuid is required');
      }

      const data = await fetchWorkspaceStatus(
        projectUuid,
        systemEntityUuid,
        workspaceType
      );

      return mapApiWorkspaceStatusToCanvas(data);
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

  return query;
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
    queryFn: async () => {
      const data = await fetchWorkspaceBulkStatus(
        projectUuid,
        stableUuids,
        workspaceType,
        {
          strict: false,
        }
      );

      return mapApiWorkspaceStatusesToCanvas(data);
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
      metadata,
    }: {
      systemEntityUuid: string;
      workspaceType: WorkspaceType;
      metadata?: Record<string, unknown>;
    }) => {
      return createEntityWorkspace(projectUuid, {
        system_entity_uuid: systemEntityUuid,
        workspace_type: workspaceType,
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

        /**
         * سازگاری با queryهای قدیمی FEM.
         */
        queryClient.invalidateQueries({
          queryKey: ['fem-status', projectUuid, variables.systemEntityUuid],
        }),

        queryClient.invalidateQueries({
          queryKey: ['fem-bulk-status', projectUuid],
        }),

        queryClient.invalidateQueries({
          queryKey: ['fem-models', projectUuid],
        }),
      ]);
    },

    meta: {
      parseError: (error: unknown): ApiErrorMap => parseSystemErrors(error),
    },
  });
}
