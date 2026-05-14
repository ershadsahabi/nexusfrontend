// src/hooks/useCreateSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSystemEntity,
  type CreateSystemEntityPayload,
} from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

export function useCreateSystemEntity(
  projectUuid: string,
  scenarioId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSystemEntityPayload) => {
      return createSystemEntity(projectUuid, payload, scenarioId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
      });
    },
  });
}
