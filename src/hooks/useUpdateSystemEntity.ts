// src/hooks/useUpdateSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { refreshProjectGraphQuery } from '@/hooks/useProjectGraph';

import { updateSystemEntity } from '@/lib/api/system';

import type { UpdateSystemEntityPayload } from '@/lib/api/system';

type Variables = {
  entityUuid: string;
  payload: UpdateSystemEntityPayload;
};

export function useUpdateSystemEntity(
  projectUuid: string,
  scenarioId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityUuid, payload }: Variables) => {
      if (!projectUuid || typeof projectUuid !== 'string') {
        throw new Error('projectUuid is required for updating system entity.');
      }

      if (!entityUuid || typeof entityUuid !== 'string') {
        throw new Error('entityUuid is required for updating system entity.');
      }

      if (!payload || typeof payload !== 'object') {
        throw new Error('payload is required for updating system entity.');
      }

      return updateSystemEntity(entityUuid, payload, {
        projectUuid,
        ...(scenarioId ? { scenarioId } : {}),
      });
    },

    onSuccess: async () => {
      /**
       * این hook فقط backend و React Query graph cache را sync می‌کند.
       *
       * نکته مهم:
       * اینجا نباید Zustand/canvas store را مستقیم update کنیم.
       * optimistic update مربوط به UI owner است، یعنی PropertiesPanel یا CanvasScene.
       *
       * بعد از mutation موفق، graph کامل را از backend می‌گیریم و cache مربوط
       * به useProjectGraph را جایگزین می‌کنیم.
       */
      await refreshProjectGraphQuery(queryClient, projectUuid, scenarioId);
    },

    onError: (error) => {
      console.error('Failed to update system entity:', error);
    },
  });
}
