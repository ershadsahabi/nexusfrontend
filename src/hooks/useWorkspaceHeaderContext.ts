// src/hooks/useWorkspaceHeaderContext.ts

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/axios';

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

type UnknownRecord = Record<string, unknown>;

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

const asRecord = (value: unknown): UnknownRecord | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return undefined;
};

const pickFromRecord = (
  record: UnknownRecord | undefined,
  keys: string[]
): string | undefined => {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];

    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }

  return undefined;
};

const pickNestedRecord = (
  record: UnknownRecord | undefined,
  keys: string[]
): UnknownRecord | undefined => {
  if (!record) return undefined;

  for (const key of keys) {
    const nested = asRecord(record[key]);
    if (nested) return nested;
  }

  return undefined;
};

const findMatchingItem = (
  items: unknown,
  id?: string
): UnknownRecord | undefined => {
  if (!Array.isArray(items) || !id) return undefined;

  return items
    .map(asRecord)
    .find((item) => {
      if (!item) return false;

      return [item.id, item.uuid].some(
        (value) => value !== undefined && String(value) === String(id)
      );
    });
};

const extractProjectName = (
  payload: unknown,
  projectUuid?: string
): string | undefined => {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;

  const directProject =
    pickNestedRecord(data, ['project', 'currentProject']) ??
    pickNestedRecord(root, ['project', 'currentProject']);

  const matchedProject =
    findMatchingItem(root?.results, projectUuid) ??
    findMatchingItem(root?.items, projectUuid) ??
    findMatchingItem(root?.projects, projectUuid) ??
    findMatchingItem(data?.results, projectUuid) ??
    findMatchingItem(data?.items, projectUuid) ??
    findMatchingItem(data?.projects, projectUuid);

  return (
    pickFromRecord(directProject, [
      'name',
      'title',
      'label',
      'displayName',
      'projectName',
    ]) ??
    pickFromRecord(matchedProject, [
      'name',
      'title',
      'label',
      'displayName',
      'projectName',
    ]) ??
    pickFromRecord(data, [
      'projectName',
      'name',
      'title',
      'label',
      'displayName',
    ]) ??
    pickFromRecord(root, [
      'projectName',
      'name',
      'title',
      'label',
      'displayName',
    ])
  );
};

const extractScenarioName = (
  payload: unknown,
  scenarioId?: string
): string | undefined => {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;

  const directScenario =
    pickNestedRecord(data, ['scenario', 'currentScenario']) ??
    pickNestedRecord(root, ['scenario', 'currentScenario']);

  const matchedScenario =
    findMatchingItem(root?.results, scenarioId) ??
    findMatchingItem(root?.items, scenarioId) ??
    findMatchingItem(root?.scenarios, scenarioId) ??
    findMatchingItem(data?.results, scenarioId) ??
    findMatchingItem(data?.items, scenarioId) ??
    findMatchingItem(data?.scenarios, scenarioId);

  return (
    pickFromRecord(directScenario, [
      'name',
      'title',
      'label',
      'displayName',
      'scenarioName',
    ]) ??
    pickFromRecord(matchedScenario, [
      'name',
      'title',
      'label',
      'displayName',
      'scenarioName',
    ]) ??
    pickFromRecord(data, [
      'scenarioName',
      'name',
      'title',
      'label',
      'displayName',
    ]) ??
    pickFromRecord(root, [
      'scenarioName',
      'name',
      'title',
      'label',
      'displayName',
    ])
  );
};

const fetchProjectName = async (
  projectUuid: string
): Promise<string | undefined> => {
  const response = await apiClient.get(`/projects/${encodeURIComponent(projectUuid)}/`);
  return extractProjectName(response.data, projectUuid);
};

const fetchScenarioName = async (
  scenarioId: string
): Promise<string | undefined> => {
  const response = await apiClient.get(`/scenarios/${encodeURIComponent(scenarioId)}/`);
  return extractScenarioName(response.data, scenarioId);
};

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

  const [state, setState] = useState<WorkspaceHeaderContext>({
    projectUuid,
    scenarioId,
    projectName: undefined,
    scenarioName: undefined,
    isLoading: Boolean(projectUuid || scenarioId),
  });

  useEffect(() => {
    let cancelled = false;

    if (!projectUuid && !scenarioId) {
      setState({
        projectUuid: undefined,
        scenarioId: undefined,
        projectName: undefined,
        scenarioName: undefined,
        isLoading: false,
        error: undefined,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      projectUuid,
      scenarioId,
      projectName:
        prev.projectUuid === projectUuid ? prev.projectName : undefined,
      scenarioName:
        prev.scenarioId === scenarioId ? prev.scenarioName : undefined,
      isLoading: true,
      error: undefined,
    }));

    const load = async () => {
      try {
        const [projectName, scenarioName] = await Promise.all([
          projectUuid ? fetchProjectName(projectUuid) : Promise.resolve(undefined),
          scenarioId ? fetchScenarioName(scenarioId) : Promise.resolve(undefined),
        ]);

        if (cancelled) return;

        setState({
          projectUuid,
          scenarioId,
          projectName,
          scenarioName,
          isLoading: false,
          error: undefined,
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          projectUuid,
          scenarioId,
          projectName: undefined,
          scenarioName: undefined,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [projectUuid, scenarioId]);

  return state;
};
