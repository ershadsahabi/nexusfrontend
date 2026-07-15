// src/store/useCanvasStore.ts

import { create } from 'zustand';

import type {
  CanvasConnection,
  CanvasEntity,
  CanvasMode,
  SystemEntityTypeSummary,
} from '@/lib/types/canvas.types';
import type { EntityVisualDefinition } from '@/lib/types/canvas.types';
import type { WorkspaceType } from '@/lib/types/workspace.types';

type Vec3 = [number, number, number];

type UpdateEntityPayload = Partial<{
  name: string;
  code: string;
  description: string;

  entityType: CanvasEntity['entityType'];

  parentUuid: string | null;
  childrenUuids: string[];

  position: Vec3;

  metadata: Record<string, unknown>;
  effectiveMetadata: Record<string, unknown>;

  sortOrder: number;
  isActive: boolean;

  isRoot: boolean;
  isLeaf: boolean;

  systemTypeUuid: string | null;
  systemTypeCode: string | null;
  systemTypeName: string | null;

  systemType: SystemEntityTypeSummary | null;
  visualDefinition: EntityVisualDefinition | null;
  renderVariant: string | null;
  colorKey: string | null;
  shapeKey: string | null;

  updatedAt?: string;
}>;

interface CanvasStoreState {
  entities: CanvasEntity[];
  connections: CanvasConnection[];

  selectedEntity: string | null;
  selectedConnection: string | null;

  mode: CanvasMode;
  edgeCreationSourceUuid: string | null;

  mouseWorld: Vec3;

  activeRootSystemUuid: string | null;
  viewDepth: number;
  focusEntityUuid: string | null;

  workspaceModalEntityUuid: string | null;
  workspaceModalType: WorkspaceType | null;

  setGraph: (
    entities: CanvasEntity[],
    connections: CanvasConnection[]
  ) => void;

  addEntity: (entity: CanvasEntity) => void;

  updateEntityProps: (
    uuid: string,
    updates: UpdateEntityPayload
  ) => void;

  removeEntity: (uuid: string) => void;

  addConnection: (connection: CanvasConnection) => void;

  removeConnection: (uuid: string) => void;

  selectEntity: (uuid: string) => void;

  selectConnection: (uuid: string) => void;

  clearSelection: () => void;

  setMode: (mode: CanvasMode) => void;

  startEdgeCreation: (uuid: string) => void;

  cancelEdgeCreation: () => void;

  setMouseWorld: (position: Vec3) => void;

  setActiveRootSystem: (uuid: string | null) => void;

  setViewDepth: (depth: number) => void;

  setFocusEntity: (uuid: string | null) => void;

  openWorkspaceModal: (
    entityUuid: string,
    workspaceType: WorkspaceType | null
  ) => void;

  closeWorkspaceModal: () => void;

  reset: () => void;
}

const DEFAULT_MOUSE_WORLD: Vec3 = [0, 0, 0];

const initialState = {
  entities: [] as CanvasEntity[],
  connections: [] as CanvasConnection[],

  selectedEntity: null as string | null,
  selectedConnection: null as string | null,

  mode: 'select' as CanvasMode,
  edgeCreationSourceUuid: null as string | null,

  mouseWorld: DEFAULT_MOUSE_WORLD,

  activeRootSystemUuid: null as string | null,
  viewDepth: 2,
  focusEntityUuid: null as string | null,

  workspaceModalEntityUuid: null as string | null,
  workspaceModalType: null as WorkspaceType | null,
};

function cloneEntity(entity: CanvasEntity): CanvasEntity {
  return {
    ...entity,
    position: [...entity.position] as Vec3,
    childrenUuids: [...entity.childrenUuids],
    metadata: entity.metadata ? { ...entity.metadata } : {},
    effectiveMetadata: entity.effectiveMetadata
      ? { ...entity.effectiveMetadata }
      : {},
    systemType: entity.systemType ? { ...entity.systemType } : null,
    visualDefinition: entity.visualDefinition
      ? { ...entity.visualDefinition }
      : null,
  };
}

function cloneConnection(connection: CanvasConnection): CanvasConnection {
  return {
    ...connection,
  };
}

function normalizeEntityHierarchy(entities: CanvasEntity[]): CanvasEntity[] {
  const normalized = entities.map((entity) => ({
    ...cloneEntity(entity),
    childrenUuids: [],
  }));

  const entityByUuid = new Map(
    normalized.map((entity) => [entity.uuid, entity])
  );

  for (const entity of normalized) {
    if (!entity.parentUuid) continue;

    const parent = entityByUuid.get(entity.parentUuid);
    if (!parent) continue;

    parent.childrenUuids = [...parent.childrenUuids, entity.uuid];
  }

  for (const entity of normalized) {
    entity.childrenUuids.sort((a, b) => {
      const entityA = entityByUuid.get(a);
      const entityB = entityByUuid.get(b);

      const sortA = entityA?.sortOrder ?? 0;
      const sortB = entityB?.sortOrder ?? 0;

      if (sortA !== sortB) return sortA - sortB;

      return (entityA?.name ?? '').localeCompare(entityB?.name ?? '');
    });

    entity.isRoot = entity.parentUuid === null;
    entity.isLeaf = entity.childrenUuids.length === 0;
  }

  return normalized;
}

function sanitizeConnections(
  entities: CanvasEntity[],
  connections: CanvasConnection[]
): CanvasConnection[] {
  const entityUuidSet = new Set(entities.map((entity) => entity.uuid));

  return connections
    .filter(
      (connection) =>
        entityUuidSet.has(connection.sourceUuid) &&
        entityUuidSet.has(connection.targetUuid)
    )
    .map(cloneConnection);
}

export const useCanvasStore = create<CanvasStoreState>((set) => ({
  ...initialState,

  setGraph: (entities, connections) =>
    set((state) => {
      const normalizedEntities = normalizeEntityHierarchy(
        entities.map(cloneEntity)
      );
      const safeConnections = sanitizeConnections(
        normalizedEntities,
        connections.map(cloneConnection)
      );

      const entityUuidSet = new Set(
        normalizedEntities.map((entity) => entity.uuid)
      );
      const connectionUuidSet = new Set(
        safeConnections.map((connection) => connection.uuid)
      );

      const isSelectedEntityValid =
        state.selectedEntity !== null && entityUuidSet.has(state.selectedEntity);

      const isSelectedConnectionValid =
        state.selectedConnection !== null &&
        connectionUuidSet.has(state.selectedConnection);

      const isEdgeCreationSourceValid =
        state.edgeCreationSourceUuid !== null &&
        entityUuidSet.has(state.edgeCreationSourceUuid);

      const isActiveRootSystemValid =
        state.activeRootSystemUuid !== null &&
        entityUuidSet.has(state.activeRootSystemUuid);

      const isFocusEntityValid =
        state.focusEntityUuid !== null &&
        entityUuidSet.has(state.focusEntityUuid);

      const isWorkspaceModalEntityValid =
        state.workspaceModalEntityUuid !== null &&
        entityUuidSet.has(state.workspaceModalEntityUuid);

      return {
        entities: normalizedEntities,
        connections: safeConnections,

        selectedEntity: isSelectedEntityValid ? state.selectedEntity : null,
        selectedConnection: isSelectedConnectionValid
          ? state.selectedConnection
          : null,

        edgeCreationSourceUuid: isEdgeCreationSourceValid
          ? state.edgeCreationSourceUuid
          : null,

        activeRootSystemUuid: isActiveRootSystemValid
          ? state.activeRootSystemUuid
          : null,

        focusEntityUuid: isFocusEntityValid ? state.focusEntityUuid : null,

        workspaceModalEntityUuid: isWorkspaceModalEntityValid
          ? state.workspaceModalEntityUuid
          : null,

        workspaceModalType: isWorkspaceModalEntityValid
          ? state.workspaceModalType
          : null,
      };
    }),

  addEntity: (entity) =>
    set((state) => ({
      entities: normalizeEntityHierarchy([
        ...state.entities.map(cloneEntity),
        cloneEntity(entity),
      ]),
    })),

  updateEntityProps: (uuid, updates) =>
    set((state) => {
      const updatedEntities = state.entities.map((entity) => {
        if (entity.uuid !== uuid) {
          return cloneEntity(entity);
        }

        return {
          ...cloneEntity(entity),
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.code !== undefined ? { code: updates.code } : {}),
          ...(updates.description !== undefined
            ? { description: updates.description }
            : {}),
          ...(updates.entityType !== undefined
            ? { entityType: updates.entityType }
            : {}),
          ...(updates.parentUuid !== undefined
            ? { parentUuid: updates.parentUuid }
            : {}),
          ...(updates.childrenUuids !== undefined
            ? { childrenUuids: [...updates.childrenUuids] }
            : {}),
          ...(updates.position !== undefined
            ? { position: [...updates.position] as Vec3 }
            : {}),
          ...(updates.metadata !== undefined
            ? { metadata: { ...updates.metadata } }
            : {}),
          ...(updates.effectiveMetadata !== undefined
            ? { effectiveMetadata: { ...updates.effectiveMetadata } }
            : {}),
          ...(updates.sortOrder !== undefined
            ? { sortOrder: updates.sortOrder }
            : {}),
          ...(updates.isActive !== undefined
            ? { isActive: updates.isActive }
            : {}),
          ...(updates.isRoot !== undefined ? { isRoot: updates.isRoot } : {}),
          ...(updates.isLeaf !== undefined ? { isLeaf: updates.isLeaf } : {}),
          ...(updates.systemTypeUuid !== undefined
            ? { systemTypeUuid: updates.systemTypeUuid }
            : {}),
          ...(updates.systemTypeCode !== undefined
            ? { systemTypeCode: updates.systemTypeCode }
            : {}),
          ...(updates.systemTypeName !== undefined
            ? { systemTypeName: updates.systemTypeName }
            : {}),
          ...(updates.systemType !== undefined
            ? {
                systemType: updates.systemType
                  ? { ...updates.systemType }
                  : null,
              }
            : {}),
          ...(updates.visualDefinition !== undefined
            ? {
                visualDefinition: updates.visualDefinition
                  ? { ...updates.visualDefinition }
                  : null,
              }
            : {}),
          ...(updates.renderVariant !== undefined
            ? { renderVariant: updates.renderVariant }
            : {}),
          ...(updates.colorKey !== undefined
            ? { colorKey: updates.colorKey }
            : {}),
          ...(updates.shapeKey !== undefined
            ? { shapeKey: updates.shapeKey }
            : {}),
          ...(updates.updatedAt !== undefined
            ? { updatedAt: updates.updatedAt }
            : {}),
        };
      });

      const shouldNormalizeHierarchy =
        updates.parentUuid !== undefined ||
        updates.childrenUuids !== undefined ||
        updates.sortOrder !== undefined ||
        updates.name !== undefined;

      return {
        entities: shouldNormalizeHierarchy
          ? normalizeEntityHierarchy(updatedEntities)
          : updatedEntities,
      };
    }),

  removeEntity: (uuid) =>
    set((state) => {
      const remainingEntities = normalizeEntityHierarchy(
        state.entities
          .filter((entity) => entity.uuid !== uuid)
          .map((entity) =>
            entity.parentUuid === uuid
              ? {
                  ...cloneEntity(entity),
                  parentUuid: null,
                }
              : cloneEntity(entity)
          )
      );

      const remainingConnections = state.connections
        .filter(
          (connection) =>
            connection.sourceUuid !== uuid && connection.targetUuid !== uuid
        )
        .map(cloneConnection);

      const selectedConnectionStillExists =
        state.selectedConnection !== null &&
        remainingConnections.some(
          (connection) => connection.uuid === state.selectedConnection
        );

      const isRemovingWorkspaceModalEntity =
        state.workspaceModalEntityUuid === uuid;

      return {
        entities: remainingEntities,
        connections: remainingConnections,

        selectedEntity:
          state.selectedEntity === uuid ? null : state.selectedEntity,

        selectedConnection: selectedConnectionStillExists
          ? state.selectedConnection
          : null,

        edgeCreationSourceUuid:
          state.edgeCreationSourceUuid === uuid
            ? null
            : state.edgeCreationSourceUuid,

        focusEntityUuid:
          state.focusEntityUuid === uuid ? null : state.focusEntityUuid,

        activeRootSystemUuid:
          state.activeRootSystemUuid === uuid
            ? null
            : state.activeRootSystemUuid,

        workspaceModalEntityUuid: isRemovingWorkspaceModalEntity
          ? null
          : state.workspaceModalEntityUuid,

        workspaceModalType: isRemovingWorkspaceModalEntity
          ? null
          : state.workspaceModalType,
      };
    }),

  addConnection: (connection) =>
    set((state) => {
      const entityUuidSet = new Set(state.entities.map((entity) => entity.uuid));

      if (
        !entityUuidSet.has(connection.sourceUuid) ||
        !entityUuidSet.has(connection.targetUuid)
      ) {
        return {};
      }

      return {
        connections: [...state.connections.map(cloneConnection), cloneConnection(connection)],
      };
    }),

  removeConnection: (uuid) =>
    set((state) => ({
      connections: state.connections
        .filter((connection) => connection.uuid !== uuid)
        .map(cloneConnection),
      selectedConnection:
        state.selectedConnection === uuid ? null : state.selectedConnection,
    })),

  selectEntity: (uuid) =>
    set(() => ({
      selectedEntity: uuid,
      selectedConnection: null,
    })),

  selectConnection: (uuid) =>
    set(() => ({
      selectedConnection: uuid,
      selectedEntity: null,
    })),

  clearSelection: () =>
    set(() => ({
      selectedEntity: null,
      selectedConnection: null,
    })),

  setMode: (mode) =>
    set(() => ({
      mode,
    })),

  startEdgeCreation: (uuid) =>
    set(() => ({
      edgeCreationSourceUuid: uuid,
      mode: 'create-edge',
      selectedEntity: uuid,
      selectedConnection: null,
    })),

  cancelEdgeCreation: () =>
    set(() => ({
      edgeCreationSourceUuid: null,
    })),

  setMouseWorld: (position) =>
    set(() => ({
      mouseWorld: [...position] as Vec3,
    })),

  setActiveRootSystem: (uuid) =>
    set(() => ({
      activeRootSystemUuid: uuid,
    })),

  setViewDepth: (depth) =>
    set(() => ({
      viewDepth: Math.max(0, depth),
    })),

  setFocusEntity: (uuid) =>
    set(() => ({
      focusEntityUuid: uuid,
    })),

  openWorkspaceModal: (entityUuid, workspaceType) =>
    set(() => ({
      workspaceModalEntityUuid: entityUuid,
      workspaceModalType: workspaceType,
    })),

  closeWorkspaceModal: () =>
    set(() => ({
      workspaceModalEntityUuid: null,
      workspaceModalType: null,
    })),

  reset: () =>
    set(() => ({
      ...initialState,
      mouseWorld: [...DEFAULT_MOUSE_WORLD] as Vec3,
    })),
}));
