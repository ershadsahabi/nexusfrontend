// src/components/cad/CadCanvas2D.tsx

'use client';

import { useCadWorkspace } from './context/CadWorkspaceContext';
import styles from './CadWorkspaceShell.module.css';

export default function CadCanvas2D() {
  const { title } = useCadWorkspace();

  return (
    <div className={styles.canvas}>
      <div className={styles.gridOverlay} />

      <svg className={styles.drawing} viewBox="0 0 900 520" role="img" aria-label="CAD preview">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
          </marker>
        </defs>

        <line x1="90" y1="260" x2="820" y2="260" className={styles.axisLine} markerEnd="url(#arrow)" />
        <line x1="450" y1="455" x2="450" y2="70" className={styles.axisLine} markerEnd="url(#arrow)" />

        <rect x="260" y="155" width="360" height="210" rx="10" className={styles.shapeMain} />
        <circle cx="450" cy="260" r="72" className={styles.shapeCut} />
        <line x1="260" y1="410" x2="620" y2="410" className={styles.dimensionLine} />
        <text x="450" y="438" className={styles.dimensionText}>3600 mm</text>
      </svg>

      <div className={styles.canvasBadge}>
        <span>Draft Preview</span>
        <strong>{title}</strong>
      </div>
    </div>
  );
}
