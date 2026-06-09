// src/features/fem/section/useFemWorkspaceSection.ts


'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchEntityWorkspace } from '@/lib/api/workspaces';
import { fetchProjectGraph } from '@/lib/api/system';
import { mapProjectGraphToCanvas } from '@/lib/mappers/canvas.mappers';

import type { CanvasEntity } from '@/lib/types/canvas.types';
import type { ApiEntityWorkspace } from '@/lib/types/workspace.types';

import type { FemSectionResolveResult } from './femSection.types';
import { mapEntityToFemSectionModel } from './femSection.mapper';

export function getFemWorkspaceSectionQueryKey(
  projectUuid: string,
  workspaceUuid: string
) {
  return ['fem-workspace-section', projectUuid, workspaceUuid] as const;
}

async function fetchFemWorkspaceSectionData(
  projectUuid: string,
  workspaceUuid: string
): Promise<{
  workspace: ApiEntityWorkspace;
  entity: CanvasEntity | null;
}> {
  const [workspace, graph] = await Promise.all([
    fetchEntityWorkspace(projectUuid, workspaceUuid),
    fetchProjectGraph(projectUuid),
  ]);

  const canvasGraph = mapProjectGraphToCanvas(graph);

  const entity =
    canvasGraph.entities.find(
      (item) => item.uuid === workspace.system_entity
    ) ?? null;

  return {
    workspace,
    entity,
  };
}

export function useFemWorkspaceSection(
  projectUuid: string,
  workspaceUuid: string
) {
  const query = useQuery({
    queryKey: getFemWorkspaceSectionQueryKey(projectUuid, workspaceUuid),
    queryFn: () => fetchFemWorkspaceSectionData(projectUuid, workspaceUuid),
    enabled: Boolean(projectUuid && workspaceUuid),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const resolved = useMemo<FemSectionResolveResult>(() => {
    const workspace = query.data?.workspace ?? null;
    const entity = query.data?.entity ?? null;

    const issues: FemSectionResolveResult['issues'] = [];

    if (!workspace && !query.isLoading) {
      issues.push({
        level: 'error',
        message: 'Workspace پیدا نشد یا هنوز بارگذاری نشده است.',
      });
    }

    if (workspace && !entity) {
      issues.push({
        level: 'error',
        message: 'System Entity متصل به این FEM Workspace در گراف پروژه پیدا نشد.',
      });
    }

    if (entity && !entity.systemType) {
      issues.push({
        level: 'warning',
        message: 'برای این موجودیت System Entity Type تعریف نشده است.',
      });
    }

    const section =
      workspace && entity
        ? mapEntityToFemSectionModel(entity, workspace)
        : null;

    if (section?.source === 'fallback') {
      issues.push({
        level: 'warning',
        message:
          'تعریف صریح مقطع در metadata پیدا نشد؛ مقطع پیش‌فرض از visual definition ساخته شد.',
      });
    }

    return {
      workspace,
      entity,
      section,
      issues,
    };
  }, [query.data, query.isLoading]);

  return {
    ...query,
    ...resolved,
  };
}
