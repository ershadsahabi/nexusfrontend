// src/hooks/useProjectGraph.ts

import { useQuery } from '@tanstack/react-query';
import { fetchProjectGraph } from '@/lib/api/system';
import { mapProjectGraphToCanvas } from '@/lib/mappers/canvas.mappers';

export const getProjectGraphQueryKey = (projectUuid: string, scenarioId?: string) =>
  ['project-graph', projectUuid, scenarioId ?? 'default'] as const;

export function useProjectGraph(projectUuid: string, scenarioId?: string) {
  return useQuery({
    queryKey: getProjectGraphQueryKey(projectUuid, scenarioId),
    queryFn: async () => {
      const graph = await fetchProjectGraph(projectUuid, scenarioId);
      return mapProjectGraphToCanvas(graph);
    },
    enabled: Boolean(projectUuid),
  });
}
