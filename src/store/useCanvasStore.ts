// src/store/useCanvasStore.ts

import { create } from 'zustand';

import type {
  CanvasConnection,
  CanvasEntity,
  CanvasMode,
} from '@/lib/types/canvas.types';
import type { WorkspaceType } from '@/lib/types/workspace.types';

type Vec3 = [number, number, number];

type UpdateEntityPayload = Partial<{
  name: string;
  code: string;
  description: string;

  entityType: CanvasEntity['entityType'];
  systemType: CanvasEntity['systemType'];

  parentId: string | null;
  childIds: string[];

  position: Vec3;

  metadata: Record<string, unknown>;

  sortOrder: number;
  isActive: boolean;

  isRoot: boolean;
  isLeaf: boolean;

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

  addConnection: (
    connection: CanvasConnection
  ) => void;

  removeConnection: (uuid: string) => void;

  selectEntity: (uuid: string) => void;

  selectConnection: (uuid: string) => void;

  clearSelection: () => void;

  setMode: (mode: CanvasMode) => void;

  startEdgeCreation: (uuid: string) => void;

  cancelEdgeCreation: () => void;

  setMouseWorld: (position: Vec3) => void;

  setActiveRootSystem: (
    uuid: string | null
  ) => void;

  setViewDepth: (depth: number) => void;

  setFocusEntity: (
    uuid: string | null
  ) => void;

  openWorkspaceModal: (
    entityUuid: string,
    workspaceType: WorkspaceType
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

  mouseWorld: DEFAULT_MOUSE_WORLD as Vec3,

  activeRootSystemUuid: null as string | null,
  viewDepth: 2,
  focusEntityUuid: null as string | null,

  workspaceModalEntityUuid: null as string | null,
  workspaceModalType: null as WorkspaceType | null,
};

export const useCanvasStore =
  create<CanvasStoreState>((set) => ({
    ...initialState,

    setGraph: (entities, connections) =>
      set((state) => {
        const entityUuidSet = new Set(
          entities.map((entity) => entity.uuid)
        );

        const connectionUuidSet = new Set(
          connections.map((connection) => connection.uuid)
        );

        return {
          entities,
          connections,

          selectedEntity:
            state.selectedEntity &&
            entityUuidSet.has(state.selectedEntity)
              ? state.selectedEntity
              : null,

          selectedConnection:
            state.selectedConnection &&
            connectionUuidSet.has(state.selectedConnection)
              ? state.selectedConnection
              : null,

          edgeCreationSourceUuid:
            state.edgeCreationSourceUuid &&
            entityUuidSet.has(state.edgeCreationSourceUuid)
              ? state.edgeCreationSourceUuid
              : null,

          activeRootSystemUuid:
            state.activeRootSystemUuid &&
            entityUuidSet.has(state.activeRootSystemUuid)
              ? state.activeRootSystemUuid
              : null,

          focusEntityUuid:
            state.focusEntityUuid &&
            entityUuidSet.has(state.focusEntityUuid)
              ? state.focusEntityUuid
              : null,

          workspaceModalEntityUuid:
            state.workspaceModalEntityUuid &&
            entityUuidSet.has(state.workspaceModalEntityUuid)
              ? state.workspaceModalEntityUuid
              : null,

          workspaceModalType:
            state.workspaceModalEntityUuid &&
            entityUuidSet.has(state.workspaceModalEntityUuid)
              ? state.workspaceModalType
              : null,
        };
      }),

    addEntity: (entity) =>
      set((state) => ({
        entities: [...state.entities, entity],
      })),

    updateEntityProps: (uuid, updates) =>
      set((state) => ({
        entities: state.entities.map((entity) =>
          entity.uuid === uuid
            ? {
                ...entity,

                ...(updates.name !== undefined
                  ? { name: updates.name }
                  : {}),

                ...(updates.code !== undefined
                  ? { code: updates.code }
                  : {}),

                ...(updates.description !== undefined
                  ? { description: updates.description }
                  : {}),

                ...(updates.entityType !== undefined
                  ? { entityType: updates.entityType }
                  : {}),

                ...(updates.systemType !== undefined
                  ? { systemType: updates.systemType }
                  : {}),

                ...(updates.parentId !== undefined
                  ? { parentId: updates.parentId }
                  : {}),

                ...(updates.childIds !== undefined
                  ? { childIds: updates.childIds }
                  : {}),

                ...(updates.position !== undefined
                  ? { position: updates.position }
                  : {}),

                ...(updates.metadata !== undefined
                  ? { metadata: updates.metadata }
                  : {}),

                ...(updates.sortOrder !== undefined
                  ? { sortOrder: updates.sortOrder }
                  : {}),

                ...(updates.isActive !== undefined
                  ? { isActive: updates.isActive }
                  : {}),

                ...(updates.isRoot !== undefined
                  ? { isRoot: updates.isRoot }
                  : {}),

                ...(updates.isLeaf !== undefined
                  ? { isLeaf: updates.isLeaf }
                  : {}),

                ...(updates.updatedAt !== undefined
                  ? { updatedAt: updates.updatedAt }
                  : {}),
              }
            : entity
        ),
      })),

    removeEntity: (uuid) =>
      set((state) => {
        const remainingEntities =
          state.entities.filter(
            (entity) => entity.uuid !== uuid
          );

        const remainingConnections =
          state.connections.filter(
            (connection) =>
              connection.sourceUuid !== uuid &&
              connection.targetUuid !== uuid
          );

        return {
          entities: remainingEntities,

          connections: remainingConnections,

          selectedEntity:
            state.selectedEntity === uuid
              ? null
              : state.selectedEntity,

          selectedConnection:
            remainingConnections.some(
              (connection) =>
                connection.uuid === state.selectedConnection
            )
              ? state.selectedConnection
              : null,

          edgeCreationSourceUuid:
            state.edgeCreationSourceUuid === uuid
              ? null
              : state.edgeCreationSourceUuid,

          focusEntityUuid:
            state.focusEntityUuid === uuid
              ? null
              : state.focusEntityUuid,

          activeRootSystemUuid:
            state.activeRootSystemUuid === uuid
              ? null
              : state.activeRootSystemUuid,

          workspaceModalEntityUuid:
            state.workspaceModalEntityUuid === uuid
              ? null
              : state.workspaceModalEntityUuid,

          workspaceModalType:
            state.workspaceModalEntityUuid === uuid
              ? null
              : state.workspaceModalType,
        };
      }),

    addConnection: (connection) =>
      set((state) => ({
        connections: [
          ...state.connections,
          connection,
        ],
      })),

    removeConnection: (uuid) =>
      set((state) => ({
        connections:
          state.connections.filter(
            (connection) =>
              connection.uuid !== uuid
          ),

        selectedConnection:
          state.selectedConnection === uuid
            ? null
            : state.selectedConnection,
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
        mouseWorld: position,
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
      })),
  }));
