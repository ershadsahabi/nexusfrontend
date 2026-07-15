// src/hooks/useUpdateEntityPosition.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { refreshProjectGraphQuery } from '@/hooks/useProjectGraph';

import { updateSystemEntity } from '@/lib/api/system';

type Variables = {
  uuid: string;
  position: [number, number, number];
};

export function useUpdateEntityPosition(
  projectUuid: string,
  scenarioId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, position }: Variables) => {
      if (!projectUuid || typeof projectUuid !== 'string') {
        throw new Error('projectUuid is required for updating entity position.');
      }

      if (!uuid || typeof uuid !== 'string') {
        throw new Error('entity uuid is required for updating entity position.');
      }

      if (
        !Array.isArray(position) ||
        position.length !== 3 ||
        !position.every((value) => Number.isFinite(value))
      ) {
        throw new Error(
          'valid position is required for updating entity position.'
        );
      }

      return updateSystemEntity(
        uuid,
        {
          pos_x: position[0],
          pos_y: position[1],
          pos_z: position[2],
        },
        {
          projectUuid,
          ...(scenarioId ? { scenarioId } : {}),
        }
      );
    },

    onSuccess: async () => {
      /**
       * این hook هم نباید مستقیماً canvas store را update کند.
       * CanvasScene قبل از mutation، position را optimistic آپدیت می‌کند.
       * اینجا فقط graph canonical را از backend می‌گیریم.
       */
      await refreshProjectGraphQuery(queryClient, projectUuid, scenarioId);
    },

    onError: (error) => {
      console.error('Failed to persist entity position:', error);
    },
  });
}
