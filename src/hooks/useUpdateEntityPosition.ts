// src/hooks/useUpdateEntityPosition.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSystemEntity } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

export function useUpdateEntityPosition(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      position,
    }: {
      uuid: string;
      position: [number, number, number];
    }) => {
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
      await queryClient.invalidateQueries({
        queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
      });
    },

    onError: (error) => {
      console.error('Failed to persist entity position:', error);
    },
  });
}
