// src/components/cad/CadWorkspaceShell.tsx

'use client';

import { CadWorkspaceProvider, useCadWorkspace } from './context/CadWorkspaceContext';
import CadBottomBar from './CadBottomBar';
import CadCanvas2D from './CadCanvas2D';
import CadHeader from './CadHeader';
import CadLeftSidebar from './CadLeftSidebar';
import CadRightSidebar from './CadRightSidebar';
import CadTopbar from './CadTopbar';
import styles from './CadWorkspaceShell.module.css';

type Props = {
  projectUuid: string;
  workspaceUuid: string;
};

function CadWorkspaceContent() {
  const { isLoading, error } = useCadWorkspace();

  if (isLoading) {
    return <div className={styles.loading}>در حال بارگذاری محیط CAD...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.workspace} dir="rtl">
      <CadHeader />
      <CadTopbar />

      <div className={styles.mainGrid}>
        <aside className={styles.leftPane}>
          <CadLeftSidebar />
        </aside>

        <main className={styles.canvasPane}>
          <CadCanvas2D />
        </main>

        <aside className={styles.rightPane}>
          <CadRightSidebar />
        </aside>
      </div>

      <CadBottomBar />
    </div>
  );
}

export default function CadWorkspaceShell(props: Props) {
  return (
    <CadWorkspaceProvider {...props}>
      <CadWorkspaceContent />
    </CadWorkspaceProvider>
  );
}
