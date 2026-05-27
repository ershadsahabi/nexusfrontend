// src/hooks/useUpdateSystemEntity.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateSystemEntity } from '@/lib/api/system';
import { getProjectGraphQueryKey } from '@/hooks/useProjectGraph';
import { mapApiEntityToCanvas } from '@/lib/mappers/canvas.mappers';
import { useCanvasStore } from '@/store/useCanvasStore';

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
  const updateEntityProps = useCanvasStore((state) => state.updateEntityProps);

  return useMutation({
    mutationFn: async (variables: Variables) => {
      const entityUuid = variables?.entityUuid;
      const payload = variables?.payload;

      if (!projectUuid) {
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

    /**
     * نکته مهم:
     * اینجا عمداً optimistic update انجام نمی‌دهیم.
     * چون validateهای backend برای parent / system_type_uuid / entity_type پیچیده هستند
     * و ممکن است PATCH با 400 برگردد.
     *
     * پس state فقط بعد از موفقیت سرور تغییر می‌کند.
     */
    onSuccess: async (updatedApiEntity) => {
      const mapped = mapApiEntityToCanvas(updatedApiEntity);

      updateEntityProps(mapped.uuid, {
        name: mapped.name,
        code: mapped.code,
        description: mapped.description,
        entityType: mapped.entityType,
        systemType: mapped.systemType,
        parentId: mapped.parentId,
        childIds: mapped.childIds,
        position: mapped.position,
        sortOrder: mapped.sortOrder,
        isActive: mapped.isActive,
        metadata: mapped.metadata,
        isRoot: mapped.isRoot,
        isLeaf: mapped.isLeaf,
        updatedAt: mapped.updatedAt,
      });

      /**
       * برای اطمینان از sync کامل کل graph:
       * مخصوصاً parent/children/connections بعد از تغییرات rule-heavy
       */
      await queryClient.invalidateQueries({
        queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
      });
    },
  });
}
