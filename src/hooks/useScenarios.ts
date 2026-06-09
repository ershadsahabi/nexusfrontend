// src/hooks/useScenarios.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScenariosService from '@/lib/api/services/scenarios.service';
import type {
  Scenario,
  ScenarioRequest,
  PaginatedScenarioList,
} from '@/lib/api/types';

export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: (projectUuid: string) =>
    [...scenarioKeys.lists(), { projectUuid }] as const,
  details: () => [...scenarioKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...scenarioKeys.details(), uuid] as const,
};

export const useScenariosList = (projectUuid?: string) => {
  return useQuery<PaginatedScenarioList, Error, Scenario[]>({
    queryKey: projectUuid
      ? scenarioKeys.list(projectUuid)
      : [...scenarioKeys.lists(), 'disabled'],
    queryFn: () => ScenariosService.getAll(projectUuid!),
    enabled: !!projectUuid,
    select: (paginatedData) => paginatedData.results,
  });
};

export const useScenarioDetail = (uuid?: string) => {
  return useQuery<Scenario, Error>({
    queryKey: uuid
      ? scenarioKeys.detail(uuid)
      : [...scenarioKeys.details(), 'disabled'],
    queryFn: () => ScenariosService.getById(uuid!),
    enabled: !!uuid,
  });
};

export const useCreateScenario = (projectUuid?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioData: ScenarioRequest) =>
      ScenariosService.create(scenarioData),

    onSuccess: (createdScenario) => {
      if (projectUuid) {
        queryClient.invalidateQueries({
          queryKey: scenarioKeys.list(projectUuid),
        });
      }

      if (createdScenario?.uuid) {
        queryClient.setQueryData(
          scenarioKeys.detail(createdScenario.uuid),
          createdScenario
        );
      }
    },
  });
};

export const useUpdateScenario = (projectUuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ScenarioRequest }) =>
      ScenariosService.update(uuid, data),

    onSuccess: (updatedScenario, { uuid }) => {
      queryClient.invalidateQueries({
        queryKey: scenarioKeys.list(projectUuid),
      });

      queryClient.setQueryData(scenarioKeys.detail(uuid), updatedScenario);
    },
  });
};

export const useDeleteScenario = (projectUuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => ScenariosService.delete(uuid),

    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({
        queryKey: scenarioKeys.list(projectUuid),
      });

      queryClient.removeQueries({
        queryKey: scenarioKeys.detail(uuid),
      });
    },
  });
};
