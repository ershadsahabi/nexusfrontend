// src/components/canvas/CanvasAxesGizmoOverlay.tsx


'use client';

import styles from './CanvasAxesGizmoOverlay.module.css';

export default function CanvasAxesGizmoOverlay() {
  return (
    <div className={styles.overlayRoot}>
      <div className={styles.debugBox}>GIZMO</div>
    </div>
  );
}
