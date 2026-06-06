// src/lib/mappers/workspace.ts

import type {
  ApiEntityWorkspace,
  ApiWorkspaceStatus,
  CanvasEntityWorkspace,
  CanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

function resolveEligible(input: ApiWorkspaceStatus): boolean {
  if (typeof input.eligible === 'boolean') return input.eligible;

  if (input.workspace_type === 'FEM') {
    return Boolean(input.fem_eligible);
  }

  if (input.workspace_type === 'CAD') {
    return Boolean(input.cad_eligible);
  }

  return false;
}

function resolveHasWorkspace(input: ApiWorkspaceStatus): boolean {
  if (typeof input.has_workspace === 'boolean') return input.has_workspace;

  if (input.workspace_type === 'FEM') {
    return Boolean(input.has_fem_model);
  }

  if (input.workspace_type === 'CAD') {
    return Boolean(input.has_cad_model);
  }

  return false;
}

function resolveWorkspaceUuid(input: ApiWorkspaceStatus): string | null {
  if (input.workspace_uuid) return input.workspace_uuid;

  if (input.workspace_type === 'FEM') {
    return input.fem_model_uuid ?? null;
  }

  if (input.workspace_type === 'CAD') {
    return input.cad_model_uuid ?? null;
  }

  return null;
}

function resolveWorkspaceId(input: ApiWorkspaceStatus): number | null {
  if (typeof input.workspace_id === 'number') return input.workspace_id;

  if (input.workspace_type === 'FEM') {
    return input.fem_model_id ?? null;
  }

  if (input.workspace_type === 'CAD') {
    return input.cad_model_id ?? null;
  }

  return null;
}

export function mapApiWorkspaceStatusToCanvas(
  input: ApiWorkspaceStatus
): CanvasWorkspaceStatus {
  return {
    systemEntityUuid: input.system_entity_uuid,
    systemEntityCode: input.system_entity_code,
    systemEntityName: input.system_entity_name,

    systemTypeUuid: input.system_type_uuid,
    systemTypeName: input.system_type_name,
    systemTypeCode: input.system_type_code,

    workspaceType: input.workspace_type,

    eligible: resolveEligible(input),
    hasWorkspace: resolveHasWorkspace(input),

    workspaceUuid: resolveWorkspaceUuid(input),
    workspaceId: resolveWorkspaceId(input),

    entityType: input.entity_type,
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

  return {
    id: input.id,
    uuid: input.uuid,

    projectUuid: input.project,

    workspaceType: input.workspace_type,

    systemEntityUuid: systemEntity.uuid,
    systemEntityCode: systemEntity.code,
    systemEntityName: systemEntity.name,

    systemTypeUuid: systemEntity.system_type_uuid,
    systemTypeName: systemEntity.system_type_name,

    eligible:
      input.workspace_type === 'FEM'
        ? systemEntity.fem_eligible
        : input.workspace_type === 'CAD'
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
