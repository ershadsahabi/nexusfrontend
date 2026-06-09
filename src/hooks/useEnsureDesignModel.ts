// src/hooks/useEnsureDesignModel.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createDesignModel } from '@/lib/api/designModels';
import { getWorkspaceStatusQueryKey } from '@/hooks/useWorkspaceModel';

import type {
  EnhancedCanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

type EnsureDesignModelInput = {
  projectUuid: string;
  workspaceUuid: string;
  systemEntityUuid: string;
  workspaceType: WorkspaceType;
  existingModelUuid?: string | null;
  code: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

export function useEnsureDesignModel() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, EnsureDesignModelInput>({
    mutationFn: async (input) => {
      if (!input.projectUuid) {
        throw new Error('projectUuid is required');
      }

      if (!input.workspaceUuid) {
        throw new Error('workspaceUuid is required');
      }

      if (!input.systemEntityUuid) {
        throw new Error('systemEntityUuid is required');
      }

      if (!input.workspaceType) {
        throw new Error('workspaceType is required');
      }

      if (!input.code || !String(input.code).trim()) {
        throw new Error('code is required');
      }

      if (input.existingModelUuid) {
        return input.existingModelUuid;
      }

      const cachedStatus =
        queryClient.getQueryData<EnhancedCanvasWorkspaceStatus>(
          getWorkspaceStatusQueryKey(
            input.projectUuid,
            input.systemEntityUuid,
            input.workspaceType
          )
        );

      if (cachedStatus?.modelUuid) {
        return cachedStatus.modelUuid;
      }

      const created = await createDesignModel({
        project_uuid: input.projectUuid,
        workspace_uuid: input.workspaceUuid,
        system_entity_uuid: input.systemEntityUuid,
        workspace_type: input.workspaceType,
        code: String(input.code).trim(),
        name: input.name,
        metadata: input.metadata ?? {},
      });

      if (!created.uuid) {
        throw new Error('Design model was created but uuid was not returned.');
      }

      return created.uuid;
    },

    onSuccess: async (_modelUuid, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getWorkspaceStatusQueryKey(
            variables.projectUuid,
            variables.systemEntityUuid,
            variables.workspaceType
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'workspace-bulk-status',
            variables.projectUuid,
            variables.workspaceType,
          ],
        }),
      ]);
    },
  });
}
