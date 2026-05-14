// src/hooks/useDeleteConnection.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteConnection } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

export function useDeleteConnection(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      return deleteConnection(uuid, {
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

