// src/features/fem/section/useGenerateFemSectionOutput.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  generateDesignSectionOutput,
  type ApiDesignSectionOutput,
  type GenerateDesignSectionOutputPayload,
} from '@/lib/api/designSectionOutputs';

import { getFemWorkspaceSectionQueryKey } from './useFemWorkspaceSection';

type GenerateFemSectionOutputInput = {
  projectUuid: string;
  workspaceUuid: string;
  systemEntityUuid: string;
  stationRatio?: number;
  name?: string;
  notes?: string;
};

export function useGenerateFemSectionOutput() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiDesignSectionOutput,
    Error,
    GenerateFemSectionOutputInput
  >({
    mutationFn: async (input) => {
      const payload: GenerateDesignSectionOutputPayload = {
        project_uuid: input.projectUuid,
        workspace_uuid: input.workspaceUuid,
        system_entity_uuid: input.systemEntityUuid,
        station_ratio: input.stationRatio ?? 0,
        name: input.name,
        notes: input.notes,
      };

      return generateDesignSectionOutput(payload);
    },

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: getFemWorkspaceSectionQueryKey(
          variables.projectUuid,
          variables.workspaceUuid
        ),
      });

      await queryClient.invalidateQueries({
        queryKey: ['design-section-outputs'],
      });
    },
  });
}
