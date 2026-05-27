// src/hooks/useSystemEntityTypes.ts

import { useQuery } from '@tanstack/react-query';

import { fetchSystemEntityTypes } from '@/lib/api/system';

export const getSystemEntityTypesQueryKey = () =>
  ['system-entity-types'] as const;

export function useSystemEntityTypes() {
  return useQuery({
    queryKey: getSystemEntityTypesQueryKey(),
    queryFn: fetchSystemEntityTypes,
    staleTime: 1000 * 60 * 10,
  });
}
