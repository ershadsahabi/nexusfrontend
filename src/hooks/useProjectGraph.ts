// src/hooks/useProjectGraph.ts

import { useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { fetchProjectGraph } from '@/lib/api/system';
import { mapProjectGraphToCanvas } from '@/lib/mappers/canvas.mappers';

import type { CanvasGraph } from '@/lib/types/canvas.types';

export const getProjectGraphQueryKey = (
  projectUuid?: string,
  scenarioId?: string
) => ['project-graph', projectUuid ?? 'none', scenarioId ?? 'default'] as const;

export async function fetchMappedProjectGraph(
  projectUuid: string,
  scenarioId?: string
): Promise<CanvasGraph> {
  if (!projectUuid) {
    throw new Error('Project UUID is required.');
  }

  const graph = await fetchProjectGraph(projectUuid, scenarioId);

  return mapProjectGraphToCanvas(graph);
}

export async function refreshProjectGraphQuery(
  queryClient: QueryClient,
  projectUuid: string,
  scenarioId?: string
): Promise<CanvasGraph> {
  if (!projectUuid) {
    throw new Error('Project UUID is required for refreshing project graph.');
  }

  const queryKey = getProjectGraphQueryKey(projectUuid, scenarioId);

  /**
   * اگر query قبلی برای همین graph هنوز در حال اجراست،
   * آن را cancel می‌کنیم تا response قدیمی‌تر بعداً cache تازه را overwrite نکند.
   */
  await queryClient.cancelQueries({
    queryKey,
  });

  /**
   * اینجا عمداً از queryClient.fetchQuery استفاده نمی‌کنیم.
   *
   * این تابع مخصوص بعد از mutation است، پس باید مطمئن باشیم graph مستقیم
   * از API/backend گرفته می‌شود، نه از cache.
   */
  const nextGraph = await fetchMappedProjectGraph(projectUuid, scenarioId);

  /**
   * cache مربوط به useProjectGraph را با graph تازه جایگزین می‌کنیم.
   *
   * هر componentای که با همین queryKey به useProjectGraph subscribe باشد،
   * از جمله CanvasScene، این داده جدید را دریافت می‌کند.
   */
  queryClient.setQueryData(queryKey, nextGraph);

  return nextGraph;
}

export function useProjectGraph(projectUuid?: string, scenarioId?: string) {
  return useQuery<CanvasGraph>({
    queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),

    enabled: Boolean(projectUuid),

    queryFn: async () => {
      if (!projectUuid) {
        throw new Error('Project UUID is required.');
      }

      return fetchMappedProjectGraph(projectUuid, scenarioId);
    },
  });
}
