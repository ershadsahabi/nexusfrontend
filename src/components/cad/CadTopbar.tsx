// src/components/cad/CadTopbar.tsx

'use client';

import styles from './CadWorkspaceShell.module.css';

const tools = ['Select', 'Line', 'Polyline', 'Rectangle', 'Circle', 'Trim', 'Offset', 'Dimension'];

export default function CadTopbar() {
  return (
    <div className={styles.topbar}>
      {tools.map((tool, index) => (
        <button
          key={tool}
          className={index === 0 ? styles.toolButtonActive : styles.toolButton}
          type="button"
        >
          {tool}
        </button>
      ))}
    </div>
  );
}
