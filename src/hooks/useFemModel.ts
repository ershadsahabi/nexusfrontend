// src/hooks/useFemModel.ts

'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createFemModel,
  fetchFemBulkStatus,
  fetchFemStatus,
  parseSystemErrors,
  type ApiErrorMap,
} from '@/lib/api/system';
import {
  mapApiFemStatusToCanvas,
  mapApiFemStatusesToCanvas,
} from '@/lib/mappers/fem';
import { useFemStatusStore } from '@/store/useFemStatusStore';

export function getFemStatusQueryKey(
  projectUuid: string,
  systemEntityUuid: string | null
) {
  return ['fem-status', projectUuid, systemEntityUuid] as const;
}

export function getFemBulkStatusQueryKey(
  projectUuid: string,
  systemEntityUuids: string[]
) {
  return [
    'fem-bulk-status',
    projectUuid,
    [...systemEntityUuids].sort().join(','),
  ] as const;
}

function normalizeUuidList(input: string[]): string[] {
  return [...new Set(input.filter(Boolean))].sort();
}

export function useFemStatus(
  projectUuid: string,
  systemEntityUuid: string | null
) {
  const setOne = useFemStatusStore((state) => state.setOne);

  const query = useQuery({
    queryKey: getFemStatusQueryKey(projectUuid, systemEntityUuid),
    queryFn: async () => {
      if (!systemEntityUuid) {
        throw new Error('systemEntityUuid is required');
      }

      const data = await fetchFemStatus(projectUuid, systemEntityUuid);
      return mapApiFemStatusToCanvas(data);
    },
    enabled: Boolean(projectUuid && systemEntityUuid),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setOne(query.data);
    }
  }, [query.data, setOne]);

  return query;
}

export function useFemBulkStatus(
  projectUuid: string,
  systemEntityUuids: string[]
) {
  const setMany = useFemStatusStore((state) => state.setMany);

  const stableUuids = useMemo(() => {
    return normalizeUuidList(systemEntityUuids);
  }, [systemEntityUuids]);

  const query = useQuery({
    queryKey: getFemBulkStatusQueryKey(projectUuid, stableUuids),
    queryFn: async () => {
      const data = await fetchFemBulkStatus(projectUuid, stableUuids, {
        strict: false,
      });

      return mapApiFemStatusesToCanvas(data);
    },
    enabled: Boolean(projectUuid && stableUuids.length > 0),

    /**
     * Canvas نباید با هر تغییر کوچک دوباره status بگیرد.
     * ۳۰ ثانیه staleTime برای وضعیت سبک FEM مناسب است.
     */
    staleTime: 30_000,

    /**
     * cache سبک وضعیت‌ها تا چند دقیقه نگه داشته شود.
     */
    gcTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setMany(query.data);
    }
  }, [query.data, setMany]);

  return query;
}

export function useCreateFemModel(projectUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      systemEntityUuid,
      metadata,
    }: {
      systemEntityUuid: string;
      metadata?: Record<string, unknown>;
    }) => {
      return createFemModel(projectUuid, {
        system_entity_uuid: systemEntityUuid,
        metadata: metadata ?? {},
      });
    },

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getFemStatusQueryKey(
            projectUuid,
            variables.systemEntityUuid
          ),
        }),

        /**
         * تمام bulk queryهای همین project invalidate می‌شوند.
         * چون queryKey آنها با ['fem-bulk-status', projectUuid, ...] شروع می‌شود.
         */
        queryClient.invalidateQueries({
          queryKey: ['fem-bulk-status', projectUuid],
        }),

        /**
         * اگر در آینده graph سبک شامل summary خاصی شد، این invalidate آماده است.
         * در وضعیت فعلی هم ضرری ندارد.
         */
        queryClient.invalidateQueries({
          queryKey: ['project-graph', projectUuid],
        }),

        queryClient.invalidateQueries({
          queryKey: ['fem-models', projectUuid],
        }),
      ]);
    },

    meta: {
      parseError: (error: unknown): ApiErrorMap => parseSystemErrors(error),
    },
  });
}
