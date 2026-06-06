// src/components/fem/FemWorkspaceShell.tsx


'use client';

import FemHeader from './FemHeader';
import FemTopbar from './FemTopbar';
import FemLeftSidebar from './FemLeftSidebar';
import FemRightSidebar from './FemRightSidebar';
import FemBottomBar from './FemBottomBar';
import FemCanvas2D from './FemCanvas2D';

import styles from './FemWorkspaceShell.module.css';

type Props = {
  projectUuid: string;
  femModelUuid: string;
};

export default function FemWorkspaceShell({
  projectUuid,
  femModelUuid,
}: Props) {
  return (
    <div className={styles.workspace} dir="rtl">
      <FemHeader projectUuid={projectUuid} femModelUuid={femModelUuid} />

      <FemTopbar />

      <div className={styles.mainGrid}>
        <aside className={styles.leftPane}>
          <FemLeftSidebar />
        </aside>

        <main className={styles.canvasPane}>
          <FemCanvas2D />
        </main>

        <aside className={styles.rightPane}>
          <FemRightSidebar />
        </aside>
      </div>

      <FemBottomBar />
    </div>
  );
}
