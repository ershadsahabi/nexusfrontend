// src/components/canvas/CanvasGizmoCameraController.tsx

'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type AxisKey = 'x' | 'y' | 'z';

type OrbitControlsLike = {
  object: THREE.Camera;
  target: THREE.Vector3;
  update: () => void;
};

export default function CanvasGizmoCameraController() {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls?: OrbitControlsLike;
  };

  const desiredCameraPos = useRef(new THREE.Vector3());
  const animatingRef = useRef(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ axis: AxisKey }>;
      const axis = customEvent.detail.axis;

      if (!controls?.target) return;

      const target = controls.target.clone();
      const distance = Math.max(6, Math.min(40, camera.position.distanceTo(target) || 12));

      switch (axis) {
        case 'x':
          desiredCameraPos.current.set(target.x + distance, target.y + distance * 0.18, target.z);
          break;
        case 'y':
          desiredCameraPos.current.set(target.x, target.y + distance, target.z + 0.001);
          break;
        case 'z':
          desiredCameraPos.current.set(target.x, target.y + distance * 0.18, target.z + distance);
          break;
      }

      animatingRef.current = true;
    };

    window.addEventListener('canvas-gizmo-rotate', handler as EventListener);

    return () => {
      window.removeEventListener('canvas-gizmo-rotate', handler as EventListener);
    };
  }, [camera.position, controls]);

  useFrame((_, dt) => {
    if (!animatingRef.current || !controls?.target) return;

    const distanceLeft = camera.position.distanceTo(desiredCameraPos.current);

    if (distanceLeft < 0.02) {
      camera.position.copy(desiredCameraPos.current);
      camera.lookAt(controls.target);
      controls.update();
      animatingRef.current = false;
      return;
    }

    const alpha = 1 - Math.exp(-10 * dt);
    camera.position.lerp(desiredCameraPos.current, alpha);
    camera.lookAt(controls.target);
    controls.update();
  });

  return null;
}
