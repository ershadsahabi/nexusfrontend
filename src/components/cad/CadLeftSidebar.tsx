// src/components/cad/CadLeftSidebar.tsx

'use client';

import styles from './CadWorkspaceShell.module.css';

const layers = [
  { name: 'Axis', color: '#38bdf8', visible: true },
  { name: 'Geometry', color: '#22c55e', visible: true },
  { name: 'Dimensions', color: '#f59e0b', visible: true },
  { name: 'Hidden', color: '#94a3b8', visible: false },
];

export default function CadLeftSidebar() {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span>لایه‌ها</span>
        <button className={styles.iconButton} type="button">+</button>
      </div>

      <div className={styles.layerList}>
        {layers.map((layer) => (
          <div key={layer.name} className={styles.layerRow}>
            <span className={styles.layerColor} style={{ background: layer.color }} />
            <span>{layer.name}</span>
            <span className={layer.visible ? styles.layerOn : styles.layerOff}>
              {layer.visible ? 'ON' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
