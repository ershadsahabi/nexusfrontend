// src/components/canvas/useCameraGizmoStore.ts

import { create } from 'zustand';

type Vector3 = { x: number; y: number; z: number };
type Quaternion = { x: number; y: number; z: number; w: number };

interface CameraState {
  quaternion: Quaternion;
  position: Vector3;
  target: Vector3;
}

interface CameraGizmoStore {
  cameraState: CameraState;
  setCameraState: (state: CameraState) => void;
}

export const useCameraGizmoStore = create<CameraGizmoStore>((set) => ({
  cameraState: {
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    position: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
  },
  setCameraState: (state) => set({ cameraState: state }),
}));
