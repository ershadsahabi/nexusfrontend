// src/store/useWorkspaceStatusStore.ts

import { create } from 'zustand';

import type {
  EnhancedCanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

type WorkspaceStatusKey = string;

type WorkspaceStatusByKey = Record<
  WorkspaceStatusKey,
  EnhancedCanvasWorkspaceStatus
>;

function normalizeWorkspaceType(type: WorkspaceType): WorkspaceType {
  return type === 'CAD' ? 'CAD' : 'FEM';
}

function buildKey(
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): WorkspaceStatusKey {
  return `${normalizeWorkspaceType(workspaceType)}:${systemEntityUuid}`;
}

type WorkspaceStatusState = {
  byKey: WorkspaceStatusByKey;

  setOne: (status: EnhancedCanvasWorkspaceStatus) => void;

  setMany: (statuses: EnhancedCanvasWorkspaceStatus[]) => void;

  remove: (
    systemEntityUuid: string,
    workspaceType: WorkspaceType
  ) => void;

  removeEntity: (systemEntityUuid: string) => void;

  clear: () => void;

  getByEntityUuid: (
    systemEntityUuid: string,
    workspaceType: WorkspaceType
  ) => EnhancedCanvasWorkspaceStatus | null;

  getEntityStatuses: (
    systemEntityUuid: string
  ) => Partial<Record<WorkspaceType, EnhancedCanvasWorkspaceStatus>>;
};

export const useWorkspaceStatusStore = create<WorkspaceStatusState>(
  (set, get) => ({
    byKey: {},

    setOne: (status) =>
      set((state) => ({
        byKey: {
          ...state.byKey,
          [buildKey(status.systemEntityUuid, status.workspaceType)]: status,
        },
      })),

    setMany: (statuses) =>
      set((state) => {
        if (statuses.length === 0) {
          return state;
        }

        const next: WorkspaceStatusByKey = {
          ...state.byKey,
        };

        for (const status of statuses) {
          if (!status.systemEntityUuid || !status.workspaceType) {
            continue;
          }

          next[buildKey(status.systemEntityUuid, status.workspaceType)] =
            status;
        }

        return {
          byKey: next,
        };
      }),

    remove: (systemEntityUuid, workspaceType) =>
      set((state) => {
        const key = buildKey(systemEntityUuid, workspaceType);

        if (!state.byKey[key]) {
          return state;
        }

        const next: WorkspaceStatusByKey = {
          ...state.byKey,
        };

        delete next[key];

        return {
          byKey: next,
        };
      }),

    removeEntity: (systemEntityUuid) =>
      set((state) => {
        const femKey = buildKey(systemEntityUuid, 'FEM');
        const cadKey = buildKey(systemEntityUuid, 'CAD');

        if (!state.byKey[femKey] && !state.byKey[cadKey]) {
          return state;
        }

        const next: WorkspaceStatusByKey = {
          ...state.byKey,
        };

        delete next[femKey];
        delete next[cadKey];

        return {
          byKey: next,
        };
      }),

    clear: () =>
      set({
        byKey: {},
      }),

    getByEntityUuid: (systemEntityUuid, workspaceType) => {
      return get().byKey[buildKey(systemEntityUuid, workspaceType)] ?? null;
    },

    getEntityStatuses: (systemEntityUuid) => {
      return {
        FEM: get().byKey[buildKey(systemEntityUuid, 'FEM')],
        CAD: get().byKey[buildKey(systemEntityUuid, 'CAD')],
      };
    },
  })
);

export function getWorkspaceStatusStoreKey(
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): string {
  return buildKey(systemEntityUuid, workspaceType);
}
