// src/hooks/useCreateConnection.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createConnection } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

type CreateConnectionInput = Parameters<typeof createConnection>[0];

export function useCreateConnection(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateConnectionInput) => {
      return createConnection(payload, {
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
