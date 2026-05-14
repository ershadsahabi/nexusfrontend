// src/hooks/useUpdateSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSystemEntity } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

type UpdateSystemEntityInput = Parameters<typeof updateSystemEntity>[1];

export function useUpdateSystemEntity(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { uuid: string; data: UpdateSystemEntityInput }) => {
      return updateSystemEntity(params.uuid, params.data, {
        projectUuid,
        ...(scenarioId ? { scenarioId } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
      });
    },
  });
}
