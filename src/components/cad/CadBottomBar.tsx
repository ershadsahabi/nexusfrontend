// src/components/cad/CadBottomBar.tsx

'use client';

import styles from './CadWorkspaceShell.module.css';

export default function CadBottomBar() {
  return (
    <footer className={styles.bottomBar}>
      <span>Grid: 10mm</span>
      <span>Snap: ON</span>
      <span>Ortho: OFF</span>
      <span>Scale: 1:1</span>
      <span className={styles.bottomAccent}>CAD Workspace Ready</span>
    </footer>
  );
}
