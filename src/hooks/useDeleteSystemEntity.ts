// src/hooks/useDeleteSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteSystemEntity } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';

export function useDeleteSystemEntity(projectUuid: string, scenarioId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      if (!projectUuid) {
        throw new Error('projectUuid is required for deleting system entity.');
      }

      if (!uuid || typeof uuid !== 'string') {
        throw new Error('uuid is required for deleting system entity.');
      }

      return deleteSystemEntity(uuid, {
        projectUuid,
        ...(scenarioId ? { scenarioId } : {}),
      });
    },

    onSuccess: async () => {
      /**
       * مهم:
       * بعد از حذف Entity، فقط خود Entity مهم نیست؛
       * connectionها، parent/children و graph state هم باید دوباره از سرور sync شوند.
       * این کار جلوی باگ‌هایی مثل رسم connection عجیب بعد از حذف را می‌گیرد.
       */
      await queryClient.invalidateQueries({
        queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
      });
    },
  });
}
