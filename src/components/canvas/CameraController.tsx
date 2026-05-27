// src/components/canvas/CameraController.tsx

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CameraPreset } from './CameraDock';

export type CameraApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  setView: (view: CameraPreset) => void;
};

// تغییر موقعیت اولیه به تناسب Z-up
// (X=8, Y=-8, Z=8) زاویه دید ایزومتریک عالی برای محیط Z-up ایجاد می‌کند
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(8, -8, 8);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

type CameraControllerProps = {
  rotateEnabled: boolean;
  onReady: (api: CameraApi) => void;
};

export default function CameraController({
  rotateEnabled,
  onReady,
}: CameraControllerProps) {
  const controlsRef = useRef<any>(null);

  // اعمال موقعیت اولیه در همان لحظه لود (Initial Load)
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls && controls.object) {
      // تنظیم دقیق محور بالا (Z) در لحظه بارگذاری
      controls.object.up.set(0, 0, 1);
      
      controls.object.position.copy(DEFAULT_CAMERA_POSITION);
      controls.target.copy(DEFAULT_TARGET);
      controls.update();
    }
  }, []);

  const animateCameraTo = useCallback(
    (position: THREE.Vector3, target: THREE.Vector3) => {
      const controls = controlsRef.current;
      if (!controls) return;
      
      // اطمینان از تنظیم بودن محور بالا حتی در حین جابجایی
      controls.object.up.set(0, 0, 1);
      
      controls.object.position.copy(position);
      controls.target.copy(target);
      controls.update();
    },
    []
  );

  const zoomByFactor = useCallback((factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, controls.target).normalize();
    const currentDistance = camera.position.distanceTo(controls.target);
    const nextDistance = Math.max(2, Math.min(80, currentDistance * factor));
    const nextPosition = new THREE.Vector3()
      .copy(controls.target)
      .add(direction.multiplyScalar(nextDistance));
    camera.position.copy(nextPosition);
    controls.update();
  }, []);

  const setView = useCallback(
    (view: CameraPreset) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const target = DEFAULT_TARGET.clone();
      const currentDistance = controls.object.position.distanceTo(controls.target) || 12;
      const distance = Math.max(6, Math.min(40, currentDistance));

      // تمامی مختصات‌ها برای سیستم Z-up اصلاح شدند
      // محور Z: ارتفاع | محور Y: جلو/عقب | محور X: چپ/راست
      switch (view) {
        case 'front':
          animateCameraTo(new THREE.Vector3(0, -distance, distance * 0.35), target);
          break;
        case 'back':
          animateCameraTo(new THREE.Vector3(0, distance, distance * 0.35), target);
          break;
        case 'left':
          animateCameraTo(new THREE.Vector3(-distance, 0, distance * 0.35), target);
          break;
        case 'right':
          animateCameraTo(new THREE.Vector3(distance, 0, distance * 0.35), target);
          break;
        case 'top':
          // برای جلوگیری از باگ قفل شدن دوربین (Gimbal Lock) در OrbitControls
          // یک مقدار بسیار ناچیز به محور Y می‌دهیم تا دقیقا روی خط عمود نباشد
          animateCameraTo(new THREE.Vector3(0, -0.001, distance), target);
          break;
        case 'iso':
        default:
          animateCameraTo(new THREE.Vector3(distance * 0.8, -distance * 0.8, distance * 0.8), target);
          break;
      }
    },
    [animateCameraTo]
  );

  const reset = useCallback(() => {
    animateCameraTo(DEFAULT_CAMERA_POSITION.clone(), DEFAULT_TARGET.clone());
  }, [animateCameraTo]);

  const zoomIn = useCallback(() => zoomByFactor(0.85), [zoomByFactor]);
  const zoomOut = useCallback(() => zoomByFactor(1.18), [zoomByFactor]);

  useEffect(() => {
    onReady({ zoomIn, zoomOut, reset, setView });
  }, [onReady, zoomIn, zoomOut, reset, setView]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      panSpeed={0.8}
      minDistance={2}
      maxDistance={80}
      // جلوگیری از رفتن دوربین به زیر سطح X-Y
      maxPolarAngle={Math.PI / 2}
      target={[0, 0, 0]}
      enableRotate={rotateEnabled}
      enableZoom
      enablePan
      screenSpacePanning={false}
      mouseButtons={{
        LEFT: rotateEnabled ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: rotateEnabled ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      }}
      touches={{
        ONE: rotateEnabled ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}
