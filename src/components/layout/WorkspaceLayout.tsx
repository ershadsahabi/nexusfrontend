// src/components/layout/WorkspaceLayout.tsx

import { ReactNode } from 'react';
import { Header } from './Header';
import { PropertiesPanel } from './PropertiesPanel';
import { RightSidebar } from './RightSidebar';
import styles from './layout.module.css';

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
