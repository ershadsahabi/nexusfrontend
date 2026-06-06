// src/lib/mappers/workspace.ts

import type {
  ApiEntityWorkspace,
  ApiWorkspaceStatus,
  CanvasEntityWorkspace,
  CanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

import { normalizeWorkspaceType } from '@/lib/types/workspace.types';

function resolveEligible(input: ApiWorkspaceStatus): boolean {
  if (typeof input.eligible === 'boolean') return input.eligible;

  const workspaceType = input.workspace_type
    ? String(input.workspace_type).toUpperCase()
    : null;

  if (workspaceType === 'FEM') {
    return Boolean(input.fem_eligible);
  }

  if (workspaceType === 'CAD') {
    return Boolean(input.cad_eligible);
  }

  return false;
}

function resolveHasWorkspace(input: ApiWorkspaceStatus): boolean {
  if (typeof input.has_workspace === 'boolean') return input.has_workspace;

  const workspaceType = input.workspace_type
    ? String(input.workspace_type).toUpperCase()
    : null;

  if (workspaceType === 'FEM') {
    return Boolean(input.has_fem_workspace);
  }

  if (workspaceType === 'CAD') {
    return Boolean(input.has_cad_workspace);
  }

  return false;
}

function resolveWorkspaceUuid(input: ApiWorkspaceStatus): string | null {
  if (input.workspace_uuid) return input.workspace_uuid;
  return null;
}

function resolveWorkspaceId(input: ApiWorkspaceStatus): number | null {
  if (typeof input.workspace_id === 'number') return input.workspace_id;
  return null;
}

export function mapApiWorkspaceStatusToCanvas(
  input: ApiWorkspaceStatus
): CanvasWorkspaceStatus {
  return {
    systemEntityUuid: input.system_entity_uuid,
    systemEntityCode: input.system_entity_code ?? null,
    systemEntityName: input.system_entity_name ?? null,

    systemTypeUuid: input.system_type_uuid ?? null,
    systemTypeName: input.system_type_name ?? null,
    systemTypeCode: input.system_type_code ?? null,

    workspaceType: normalizeWorkspaceType(input.workspace_type ?? 'FEM'),

    eligible: resolveEligible(input),
    hasWorkspace: resolveHasWorkspace(input),

    workspaceUuid: resolveWorkspaceUuid(input),
    workspaceId: resolveWorkspaceId(input),

    entityType: input.entity_type ?? null,
  };
}

export function mapApiWorkspaceStatusesToCanvas(
  input: ApiWorkspaceStatus[]
): CanvasWorkspaceStatus[] {
  return input.map(mapApiWorkspaceStatusToCanvas);
}

export function mapApiEntityWorkspaceToCanvas(
  input: ApiEntityWorkspace
): CanvasEntityWorkspace {
  const systemEntity = input.system_entity;
  const workspaceType = normalizeWorkspaceType(input.workspace_type);

  return {
    id: input.id,
    uuid: input.uuid,

    projectUuid: input.project,

    workspaceType,

    systemEntityUuid: systemEntity.uuid,
    systemEntityCode: systemEntity.code ?? null,
    systemEntityName: systemEntity.name ?? null,

    systemTypeUuid: systemEntity.system_type_uuid ?? null,
    systemTypeName: systemEntity.system_type_name ?? null,

    eligible:
      workspaceType === 'FEM'
        ? systemEntity.fem_eligible
        : workspaceType === 'CAD'
          ? systemEntity.cad_eligible
          : undefined,

    metadata: input.metadata ?? {},
  };
}

export function createEmptyWorkspaceStatus(
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): CanvasWorkspaceStatus {
  return {
    systemEntityUuid,
    workspaceType,
    eligible: false,
    hasWorkspace: false,
    workspaceUuid: null,
    workspaceId: null,
  };
}
