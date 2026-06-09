// src/components/fem/context/FemSectionEditorContext.tsx

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useFemWorkspaceSection } from '@/features/fem/section/useFemWorkspaceSection';
import { useSaveFemSectionDraft } from '@/features/fem/section/useSaveFemSectionDraft';

import {
  createFemSectionDraft,
  patchFemSectionDimensions,
} from '@/features/fem/section/femSection.draft';

import type {
  FemSectionCanvasState,
  FemSectionDraft,
  FemSectionDimensions,
} from '@/features/fem/section/femSection.types';

type FemSectionEditorContextValue = {
  projectUuid: string;
  workspaceUuid: string;

  workspace: ReturnType<typeof useFemWorkspaceSection>['workspace'];
  entity: ReturnType<typeof useFemWorkspaceSection>['entity'];
  section: ReturnType<typeof useFemWorkspaceSection>['section'];
  issues: ReturnType<typeof useFemWorkspaceSection>['issues'];

  isLoading: boolean;
  isError: boolean;

  draft: FemSectionDraft | null;
  canvasState: FemSectionCanvasState;

  setSelected: (selected: boolean) => void;
  setCanvasPosition: (x: number, y: number) => void;
  patchDimensions: (patch: Partial<FemSectionDimensions>) => void;
  patchDraft: (patch: Partial<FemSectionDraft>) => void;
  resetDraft: () => void;

  saveOutput: () => void;
  isSaving: boolean;
  saveError: string | null;
  savedRevision: number | null;
};

const FemSectionEditorContext = createContext<FemSectionEditorContextValue | null>(null);

type Props = {
  projectUuid: string;
  workspaceUuid: string;
  children: React.ReactNode;
};

function resolveSystemEntityUuid(
  workspace: ReturnType<typeof useFemWorkspaceSection>['workspace'],
  entity: ReturnType<typeof useFemWorkspaceSection>['entity']
): string | null {
  const workspaceAny = workspace as unknown as Record<string, unknown> | null;

  const directWorkspaceValue =
    workspaceAny?.system_entity_uuid ??
    workspaceAny?.systemEntityUuid ??
    workspaceAny?.system_entity ??
    workspaceAny?.systemEntity;

  if (typeof directWorkspaceValue === 'string' && directWorkspaceValue.trim()) {
    return directWorkspaceValue.trim();
  }

  if (
    directWorkspaceValue &&
    typeof directWorkspaceValue === 'object' &&
    'uuid' in directWorkspaceValue
  ) {
    const uuid = (directWorkspaceValue as { uuid?: unknown }).uuid;

    if (typeof uuid === 'string' && uuid.trim()) {
      return uuid.trim();
    }
  }

  if (typeof entity?.uuid === 'string' && entity.uuid.trim()) {
    return entity.uuid.trim();
  }

  return null;
}

export function FemSectionEditorProvider({
  projectUuid,
  workspaceUuid,
  children,
}: Props) {
  const sectionQuery = useFemWorkspaceSection(projectUuid, workspaceUuid);
  const saveDraftMutation = useSaveFemSectionDraft();

  const [draft, setDraft] = useState<FemSectionDraft | null>(null);

  const [canvasState, setCanvasState] = useState<FemSectionCanvasState>({
    x: 0,
    y: 0,
    selected: false,
  });

  useEffect(() => {
    if (!sectionQuery.section) {
      setDraft(null);
      return;
    }

    setDraft(createFemSectionDraft(sectionQuery.section));
  }, [sectionQuery.section]);

  const setSelected = useCallback((selected: boolean) => {
    setCanvasState((prev) => ({
      ...prev,
      selected,
    }));
  }, []);

  const setCanvasPosition = useCallback((x: number, y: number) => {
    setCanvasState((prev) => ({
      ...prev,
      x,
      y,
    }));
  }, []);

  const patchDimensions = useCallback((patch: Partial<FemSectionDimensions>) => {
    setDraft((prev) => {
      if (!prev) return prev;

      return patchFemSectionDimensions(prev, patch);
    });
  }, []);

  const patchDraft = useCallback((patch: Partial<FemSectionDraft>) => {
    setDraft((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...patch,
        material: patch.material
          ? {
              ...prev.material,
              ...patch.material,
            }
          : prev.material,
        dimensions: patch.dimensions
          ? {
              ...prev.dimensions,
              ...patch.dimensions,
            }
          : prev.dimensions,
      };
    });
  }, []);

  const resetDraft = useCallback(() => {
    if (!sectionQuery.section) return;

    setDraft(createFemSectionDraft(sectionQuery.section));
  }, [sectionQuery.section]);

  const saveOutput = useCallback(() => {
    const systemEntityUuid = resolveSystemEntityUuid(
      sectionQuery.workspace,
      sectionQuery.entity
    );

    if (!projectUuid || !workspaceUuid || !systemEntityUuid || !draft) {
      console.warn('Cannot save FEM section draft. Missing required data.', {
        projectUuid,
        workspaceUuid,
        systemEntityUuid,
        hasDraft: Boolean(draft),
      });

      return;
    }

    saveDraftMutation.mutate({
      projectUuid,
      workspaceUuid,
      systemEntityUuid,
      stationRatio: 0,
      name: draft.label,
      notes: 'Saved from FEM section editor.',
      sectionKind: draft.kind,
      sectionLabel: draft.label,
      units: draft.units,
      dimensions: draft.dimensions,
      material: draft.material,
    });
  }, [
    draft,
    projectUuid,
    saveDraftMutation,
    sectionQuery.entity,
    sectionQuery.workspace,
    workspaceUuid,
  ]);

  const value = useMemo<FemSectionEditorContextValue>(
    () => ({
      projectUuid,
      workspaceUuid,

      workspace: sectionQuery.workspace,
      entity: sectionQuery.entity,
      section: sectionQuery.section,
      issues: sectionQuery.issues,

      isLoading: sectionQuery.isLoading,
      isError: sectionQuery.isError,

      draft,
      canvasState,

      setSelected,
      setCanvasPosition,
      patchDimensions,
      patchDraft,
      resetDraft,

      saveOutput,
      isSaving: saveDraftMutation.isPending,
      saveError: saveDraftMutation.error?.message ?? null,
      savedRevision: saveDraftMutation.data?.revision ?? null,
    }),
    [
      projectUuid,
      workspaceUuid,

      sectionQuery.workspace,
      sectionQuery.entity,
      sectionQuery.section,
      sectionQuery.issues,
      sectionQuery.isLoading,
      sectionQuery.isError,

      draft,
      canvasState,

      setSelected,
      setCanvasPosition,
      patchDimensions,
      patchDraft,
      resetDraft,

      saveOutput,
      saveDraftMutation.isPending,
      saveDraftMutation.error?.message,
      saveDraftMutation.data?.revision,
    ]
  );

  return (
    <FemSectionEditorContext.Provider value={value}>
      {children}
    </FemSectionEditorContext.Provider>
  );
}

export function useFemSectionEditor() {
  const context = useContext(FemSectionEditorContext);

  if (!context) {
    throw new Error('useFemSectionEditor must be used inside FemSectionEditorProvider');
  }

  return context;
}
