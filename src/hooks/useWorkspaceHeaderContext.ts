// src/hooks/useWorkspaceHeaderContext.ts

'use client';

import { useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { useProjectDetail } from '@/hooks/useProjects';
import { useScenarioDetail } from '@/hooks/useScenarios';

type UseWorkspaceHeaderContextArgs = {
  projectUuid?: string;
  scenarioId?: string;
};

type WorkspaceHeaderContext = {
  projectUuid?: string;
  scenarioId?: string;
  projectName?: string;
  scenarioName?: string;
  isLoading: boolean;
  error?: string;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const firstNonEmpty = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (isNonEmptyString(value)) return value.trim();

    if (Array.isArray(value)) {
      const found = value.find(isNonEmptyString);
      if (found) return found.trim();
    }
  }

  return undefined;
};

function extractErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return undefined;
}

export const useWorkspaceHeaderContext = (
  args: UseWorkspaceHeaderContextArgs = {}
): WorkspaceHeaderContext => {
  const params = useParams();
  const searchParams = useSearchParams();

  const routeProjectUuid = useMemo(() => {
    return firstNonEmpty(
      params?.projectUuid,
      params?.projectId,
      params?.project,
      params?.id
    );
  }, [params]);

  const routeScenarioId = useMemo(() => {
    return firstNonEmpty(
      params?.scenarioId,
      params?.scenarioUuid,
      params?.scenario,
      searchParams.get('scenarioId'),
      searchParams.get('scenarioUuid'),
      searchParams.get('scenario')
    );
  }, [params, searchParams]);

  const projectUuid = firstNonEmpty(args.projectUuid, routeProjectUuid);
  const scenarioId = firstNonEmpty(args.scenarioId, routeScenarioId);

  const {
    data: project,
    isLoading: isProjectLoading,
    isFetching: isProjectFetching,
    error: projectError,
  } = useProjectDetail(projectUuid ?? '');

  const {
    data: scenario,
    isLoading: isScenarioLoading,
    isFetching: isScenarioFetching,
    error: scenarioError,
  } = useScenarioDetail(scenarioId);

  const projectName = useMemo(() => {
    if (!project) return undefined;

    const maybeProject = project as Record<string, unknown>;
    const name = maybeProject.name;

    return typeof name === 'string' && name.trim() ? name.trim() : undefined;
  }, [project]);

  const scenarioName = useMemo(() => {
    if (!scenario) return undefined;

    const maybeScenario = scenario as Record<string, unknown>;
    const name = maybeScenario.name;

    return typeof name === 'string' && name.trim() ? name.trim() : undefined;
  }, [scenario]);

  const isLoading =
    (!!projectUuid && (isProjectLoading || isProjectFetching)) ||
    (!!scenarioId && (isScenarioLoading || isScenarioFetching));

  const error = extractErrorMessage(projectError) ?? extractErrorMessage(scenarioError);

  return {
    projectUuid,
    scenarioId,
    projectName,
    scenarioName,
    isLoading,
    error,
  };
};
