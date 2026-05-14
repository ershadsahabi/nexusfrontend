// src/components/canvas/useCameraGizmoStore.ts

import { create } from 'zustand';

type Vec3 = { x: number; y: number; z: number };
type Quat = { x: number; y: number; z: number; w: number };

type CameraGizmoState = {
  quaternion: Quat;
  position: Vec3;
  target: Vec3;
  setCameraState: (payload: {
    quaternion: Quat;
    position: Vec3;
    target: Vec3;
  }) => void;
};

export const useCameraGizmoStore = create<CameraGizmoState>((set) => ({
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  position: { x: 8, y: 8, z: 8 },
  target: { x: 0, y: 0, z: 0 },
  setCameraState: ({ quaternion, position, target }) =>
    set({ quaternion, position, target }),
}));
