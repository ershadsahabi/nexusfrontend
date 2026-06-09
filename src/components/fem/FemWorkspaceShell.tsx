// src/components/fem/FemWorkspaceShell.tsx

'use client';

import { FemWorkspaceProvider, useFemWorkspace } from './context/FemWorkspaceContext';
import { FemSectionEditorProvider } from './context/FemSectionEditorContext';
import FemHeader from './FemHeader';
import FemTopbar from './FemTopbar';
import FemLeftSidebar from './FemLeftSidebar';
import FemRightSidebar from './FemRightSidebar';
import FemBottomBar from './FemBottomBar';
import FemCanvas2D from './FemCanvas2D';
import styles from './FemWorkspaceShell.module.css';

type Props = {
  projectUuid: string;
  workspaceUuid: string;
};

function FemWorkspaceContent({
  projectUuid,
  workspaceUuid,
}: Props) {
  const { isLoading, error } = useFemWorkspace();

  if (isLoading) {
    return <div className={styles.loading}>در حال بارگذاری محیط FEM...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <FemSectionEditorProvider
      projectUuid={projectUuid}
      workspaceUuid={workspaceUuid}
    >
      <div className={styles.workspace} dir="rtl">
        <FemHeader />
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
    </FemSectionEditorProvider>
  );
}

export default function FemWorkspaceShell(props: Props) {
  return (
    <FemWorkspaceProvider {...props}>
      <FemWorkspaceContent {...props} />
    </FemWorkspaceProvider>
  );
}
