// src/store/useFemStatusStore.ts

import { create } from 'zustand';

import type { CanvasFemStatus } from '@/lib/types/canvas.types';

type FemStatusByEntityUuid = Record<string, CanvasFemStatus>;

type FemStatusState = {
  byEntityUuid: FemStatusByEntityUuid;

  setOne: (status: CanvasFemStatus) => void;
  setMany: (statuses: CanvasFemStatus[]) => void;

  remove: (systemEntityUuid: string) => void;
  clear: () => void;

  getByEntityUuid: (systemEntityUuid: string) => CanvasFemStatus | null;
};

export const useFemStatusStore = create<FemStatusState>((set, get) => ({
  byEntityUuid: {},

  setOne: (status) =>
    set((state) => ({
      byEntityUuid: {
        ...state.byEntityUuid,
        [status.systemEntityUuid]: status,
      },
    })),

  setMany: (statuses) =>
    set((state) => {
      if (statuses.length === 0) {
        return state;
      }

      const next: FemStatusByEntityUuid = {
        ...state.byEntityUuid,
      };

      for (const status of statuses) {
        next[status.systemEntityUuid] = status;
      }

      return {
        byEntityUuid: next,
      };
    }),

  remove: (systemEntityUuid) =>
    set((state) => {
      if (!state.byEntityUuid[systemEntityUuid]) {
        return state;
      }

      const next: FemStatusByEntityUuid = {
        ...state.byEntityUuid,
      };

      delete next[systemEntityUuid];

      return {
        byEntityUuid: next,
      };
    }),

  clear: () =>
    set({
      byEntityUuid: {},
    }),

  getByEntityUuid: (systemEntityUuid) => {
    return get().byEntityUuid[systemEntityUuid] ?? null;
  },
}));
