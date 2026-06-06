// src/store/useWorkspaceStatusStore.ts

import { create } from 'zustand';

import type {
  CanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

type WorkspaceStatusKey = string;

type WorkspaceStatusByKey = Record<WorkspaceStatusKey, CanvasWorkspaceStatus>;

function buildKey(
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): WorkspaceStatusKey {
  return `${workspaceType}:${systemEntityUuid}`;
}

type WorkspaceStatusState = {
  byKey: WorkspaceStatusByKey;

  setOne: (status: CanvasWorkspaceStatus) => void;
  setMany: (statuses: CanvasWorkspaceStatus[]) => void;

  remove: (systemEntityUuid: string, workspaceType: WorkspaceType) => void;

  clear: () => void;

  getByEntityUuid: (
    systemEntityUuid: string,
    workspaceType: WorkspaceType
  ) => CanvasWorkspaceStatus | null;
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

    clear: () =>
      set({
        byKey: {},
      }),

    getByEntityUuid: (systemEntityUuid, workspaceType) => {
      return get().byKey[buildKey(systemEntityUuid, workspaceType)] ?? null;
    },
  })
);

export function getWorkspaceStatusStoreKey(
  systemEntityUuid: string,
  workspaceType: WorkspaceType
): string {
  return buildKey(systemEntityUuid, workspaceType);
}
