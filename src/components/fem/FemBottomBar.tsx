// src/components/fem/FemBottomBar.tsx


'use client';

import styles from './FemBottomBar.module.css';

export default function FemBottomBar() {
  return (
    <footer className={styles.bottomBar}>
      <div className={styles.group}>
        <span className={styles.item}>Workspace: 2D Draft</span>
        <span className={styles.sep} />
        <span className={styles.item}>Grid: 24px</span>
        <span className={styles.sep} />
        <span className={styles.item}>Snap: Off</span>
      </div>

      <div className={styles.group}>
        <span className={styles.item}>Selection: 0</span>
        <span className={styles.sep} />
        <span className={styles.item}>Zoom: 100%</span>
        <span className={styles.sep} />
        <span className={styles.item}>Ready</span>
      </div>
    </footer>
  );
}
