// src/components/layout/WorkspaceLayout.tsx

import { ReactNode } from 'react';
import { Header } from './shared/Header';
import { PropertiesPanel } from './PropertiesPanel';
import { RightSidebar } from './shared/RightSidebar';
import styles from './WorkspaceLayout.module.css';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => {
  return (
    <div className={styles.workspaceContainer} dir="rtl">
      <Header />

      <div className={styles.mainContent}>
        <RightSidebar />

        <main className={styles.canvasArea}>
          {children}
        </main>

        <aside className={styles.leftSidebar}>
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
};
