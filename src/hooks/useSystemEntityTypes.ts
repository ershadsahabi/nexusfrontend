// src/hooks/useSystemEntityTypes.ts

import { useQuery } from '@tanstack/react-query';
import { fetchSystemEntityTypes } from '@/lib/api/system';

export const SYSTEM_ENTITY_TYPES_QUERY_KEY = ['system-entity-types'] as const;

export function useSystemEntityTypes() {
  return useQuery({
    queryKey: SYSTEM_ENTITY_TYPES_QUERY_KEY,
    queryFn: async () => {
      return fetchSystemEntityTypes();
    },
    // از آنجا که این لیست ثابت است و به ندرت تغییر می‌کند، می‌توانیم زمان کش را بالا ببریم
    staleTime: 5 * 60 * 1000, 
  });
}
