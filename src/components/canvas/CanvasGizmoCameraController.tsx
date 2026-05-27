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
      const distance = Math.max(8, Math.min(50, camera.position.distanceTo(target) || 16));

      // محاسبه موقعیت جدید با اعمال زاویه ایزومتریک ملایم
      // Z محور ارتفاع شده است
      switch (axis) {
        case 'x': // نمای جانبی راست
          desiredCameraPos.current.set(target.x + distance, target.y, target.z);
          break;
        case 'y': // نمای جانبی جلو
          desiredCameraPos.current.set(target.x, target.y - distance, target.z);
          break;
        case 'z': // نمای بالا (Z محور ارتفاع)
          // استفاده از انحراف در Y برای جلوگیری از قفل شدن گیمبال/وارونه شدن تصویر
          desiredCameraPos.current.set(target.x, target.y - 0.001, target.z + distance);
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

    if (distanceLeft < 0.05) {
      camera.position.copy(desiredCameraPos.current);
      camera.lookAt(controls.target);
      controls.update();
      animatingRef.current = false;
      return;
    }

    const damping = 1 - Math.exp(-8 * dt);
    camera.position.lerp(desiredCameraPos.current, damping);
    camera.lookAt(controls.target);
    controls.update();
  });

  return null;
}
