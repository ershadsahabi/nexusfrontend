// src/hooks/useDeleteSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSystemEntity } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

export function useDeleteSystemEntity(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      return deleteSystemEntity(uuid, {
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
