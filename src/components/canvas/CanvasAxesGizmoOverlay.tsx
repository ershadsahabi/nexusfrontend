// src/components/canvas/CanvasAxesGizmoOverlay.tsx

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useCameraGizmoStore } from './useCameraGizmoStore';
import styles from './CanvasAxesGizmoOverlay.module.css';

type AxisKey = 'x' | 'y' | 'z';

export default function CanvasAxesGizmoOverlay() {
  const cameraState = useCameraGizmoStore((s) => s.cameraState);

  const axes = useMemo(() => {
    // ایجاد کواترنیون دوربین و معکوس کردن آن برای اعمال روی محورهای Gizmo
    const q = new THREE.Quaternion(
      cameraState.quaternion.x,
      cameraState.quaternion.y,
      cameraState.quaternion.z,
      cameraState.quaternion.w
    );
    q.invert();

    // محاسبه بردارهای جهتی X, Y, Z
    const xAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const yAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const zAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(q);

    // استاندارد رنگ مهندسی (قرمز: X، سبز: Y، آبی: Z)
    return [
      { id: 'x' as AxisKey, color: '#ef4444', vector: xAxis, label: 'X' },
      { id: 'y' as AxisKey, color: '#22c55e', vector: yAxis, label: 'Y' },
      { id: 'z' as AxisKey, color: '#3b82f6', vector: zAxis, label: 'Z' },
    ].sort((a, b) => a.vector.z - b.vector.z); // مرتب‌سازی بر اساس عمق برای Z-Index درست
  }, [cameraState.quaternion]);

  const handleAxisClick = (axis: AxisKey) => {
    window.dispatchEvent(
      new CustomEvent('canvas-gizmo-rotate', { detail: { axis } })
    );
  };

  const center = 44; // مرکز SVG (نصف 88)
  const length = 28; // طول هر محور

  return (
    <div className={styles.overlayRoot}>
      <div className={styles.gizmo}>
        <svg className={styles.svg} viewBox="0 0 88 88">
          {/* نقطه مرکزی (Origin) */}
          <circle cx={center} cy={center} r={3} className={styles.origin} />

          {/* رسم محورها */}
          {axes.map((axis) => {
            const isFaded = axis.vector.z < -0.2; // اگر محور به سمت داخل صفحه رفت، کم‌رنگ شود
            const x = center + axis.vector.x * length;
            const y = center - axis.vector.y * length; // Y در SVG برعکس است

            return (
              <g key={axis.id} opacity={isFaded ? 0.4 : 1}>
                {/* خط محور */}
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={axis.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* دکمه دایره‌ای انتهای محور */}
                <circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill={axis.color}
                  className={styles.axisButton}
                  onClick={() => handleAxisClick(axis.id)}
                />

                {/* متن محور */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={styles.axisText}
                  onClick={() => handleAxisClick(axis.id)}
                >
                  {axis.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
