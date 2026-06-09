// src/features/fem/section/useSaveFemSectionDraft.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  saveDraftDesignSectionOutput,
  type ApiDesignSectionOutput,
  type SaveDraftDesignSectionOutputPayload,
} from '@/lib/api/designSectionOutputs';

import { getFemWorkspaceSectionQueryKey } from './useFemWorkspaceSection';
import type {
  FemSectionDimensions,
  FemSectionKind,
  FemSectionMaterial,
  FemSectionUnit,
} from './femSection.types';

type SaveFemSectionDraftInput = {
  projectUuid: string;
  workspaceUuid: string;
  systemEntityUuid: string;
  designModelUuid?: string | null;
  stationRatio?: number;
  station?: number | null;
  sectionAssignment?: number | null;
  name?: string;
  notes?: string;
  sectionKind: FemSectionKind;
  sectionLabel: string;
  units: FemSectionUnit;
  dimensions: FemSectionDimensions;
  material: FemSectionMaterial;
};

function cleanRecord<T extends Record<string, unknown>>(
  record: T
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

export function useSaveFemSectionDraft() {
  const queryClient = useQueryClient();

  return useMutation<ApiDesignSectionOutput, Error, SaveFemSectionDraftInput>({
    mutationFn: async (input) => {
      if (!input.projectUuid) {
        throw new Error('projectUuid is required');
      }

      if (!input.workspaceUuid) {
        throw new Error('workspaceUuid is required');
      }

      if (!input.systemEntityUuid) {
        throw new Error('systemEntityUuid is required');
      }

      const dimensions = cleanRecord({
        ...input.dimensions,
        units: input.units,
        section_kind: input.sectionKind,
        section_label: input.sectionLabel,
      });

      const material = cleanRecord({
        ...input.material,
      });

      const payload: SaveDraftDesignSectionOutputPayload = {
        project_uuid: input.projectUuid,
        workspace_uuid: input.workspaceUuid,
        system_entity_uuid: input.systemEntityUuid,
        design_model_uuid: input.designModelUuid ?? null,
        station_ratio: input.stationRatio ?? 0,
        station: input.station ?? null,
        section_assignment: input.sectionAssignment ?? null,
        name: input.name ?? input.sectionLabel,
        notes: input.notes ?? '',
        section_kind: input.sectionKind,
        section_label: input.sectionLabel,
        dimensions,
        material,
      };

      return saveDraftDesignSectionOutput(payload);
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
