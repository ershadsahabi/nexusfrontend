// src/components/canvas/CanvasCameraSync.tsx

'use client';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraGizmoStore } from './useCameraGizmoStore';

type OrbitControlsLike = {
  target: THREE.Vector3;
};

export default function CanvasCameraSync() {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls?: OrbitControlsLike;
  };

  const setCameraState = useCameraGizmoStore((s) => s.setCameraState);

  useFrame(() => {
    setCameraState({
      quaternion: {
        x: camera.quaternion.x,
        y: camera.quaternion.y,
        z: camera.quaternion.z,
        w: camera.quaternion.w,
      },
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      target: controls?.target
        ? {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          }
        : { x: 0, y: 0, z: 0 },
    });
  });

  return null;
}
