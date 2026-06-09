// src/features/fem/section/useSaveFemSectionDraftWithEnsure.ts


'use client';

import { useMutation } from '@tanstack/react-query';

import { useEnsureDesignModel } from '@/hooks/useEnsureDesignModel';
import { useSaveFemSectionDraft } from './useSaveFemSectionDraft';

import type { ApiDesignSectionOutput } from '@/lib/api/designSectionOutputs';
import type {
  FemSectionDimensions,
  FemSectionKind,
  FemSectionMaterial,
  FemSectionUnit,
} from './femSection.types';

export type SaveFemSectionDraftWithEnsureInput = {
  projectUuid: string;
  workspaceUuid: string;
  systemEntityUuid: string;
  existingModelUuid?: string | null;
  code: string;
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

function buildDesignModelName(input: SaveFemSectionDraftWithEnsureInput): string {
  const sectionLabel = String(input.sectionLabel ?? '').trim();
  const sectionKind = String(input.sectionKind ?? '').trim();

  if (sectionLabel && sectionKind) {
    return `${sectionLabel} - ${sectionKind} FEM Model`;
  }

  if (sectionLabel) {
    return `${sectionLabel} FEM Model`;
  }

  return 'FEM Design Model';
}

export function useSaveFemSectionDraftWithEnsure() {
  const ensureDesignModel = useEnsureDesignModel();
  const saveDraft = useSaveFemSectionDraft();

  return useMutation<
    ApiDesignSectionOutput,
    Error,
    SaveFemSectionDraftWithEnsureInput
  >({
    mutationFn: async (input) => {
      const safeCode = String(input.code ?? '').trim();

      if (!safeCode) {
        throw new Error('code is required');
      }

      const designModelUuid = await ensureDesignModel.mutateAsync({
        projectUuid: input.projectUuid,
        workspaceUuid: input.workspaceUuid,
        systemEntityUuid: input.systemEntityUuid,
        workspaceType: 'FEM',
        existingModelUuid: input.existingModelUuid ?? null,
        code: safeCode,
        name: buildDesignModelName(input),
        metadata: {
          source: 'save_fem_section_draft',
          workspace_uuid: input.workspaceUuid,
          system_entity_uuid: input.systemEntityUuid,
          section_kind: input.sectionKind,
          section_label: input.sectionLabel,
          system_entity_code: safeCode,
        },
      });

      return saveDraft.mutateAsync({
        projectUuid: input.projectUuid,
        workspaceUuid: input.workspaceUuid,
        systemEntityUuid: input.systemEntityUuid,
        designModelUuid,
        stationRatio: input.stationRatio,
        station: input.station,
        sectionAssignment: input.sectionAssignment,
        name: input.name,
        notes: input.notes,
        sectionKind: input.sectionKind,
        sectionLabel: input.sectionLabel,
        units: input.units,
        dimensions: input.dimensions,
        material: input.material,
      });
    },
  });
}
