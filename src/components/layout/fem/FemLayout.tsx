// src/components/layout/fem/FemLayout.tsx
'use client';

import React, { ReactNode } from 'react';
import styles from './FemLayout.module.css';

interface FemLayoutProps {
  children: ReactNode;
  projectUuid: string;
  femModelUuid: string;
}

export default function FemLayout({ children, projectUuid, femModelUuid }: FemLayoutProps) {
  return (
    <div className={styles.femContainer}>
      {/* هدر اختصاصی FEM */}
      <header className={styles.femHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backBtn}
            onClick={() => window.history.back()}
          >
            ←
          </button>
          <div className={styles.titleInfo}>
            <h1>FEM Workspace</h1>
            <span>Project: {projectUuid.slice(0, 8)}...</span>
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          <div className={styles.modelBadge}>2D ANALYSIS MODE</div>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.actionBtnPrimary}>Run Analysis</button>
        </div>
      </header>

      <main className={styles.femContent}>
        {/* سایدبار چپ: درخت مدل FEM */}
        <aside className={styles.femSidebarLeft}>
          <div className={styles.panelTitle}>Model Tree</div>
          <div className={styles.placeholderTree}>
             <div>• Geometry</div>
             <div>• Mesh (2D)</div>
             <div>• Materials</div>
             <div>• Boundary Conditions</div>
          </div>
        </aside>

        {/* بخش مرکزی: Canvas */}
        <section className={styles.femCanvasArea}>
          {children}
        </section>

        {/* سایدبار راست: Inspector */}
        <aside className={styles.femSidebarRight}>
          <div className={styles.panelTitle}>Properties</div>
          <div className={styles.placeholderEmpty}>
            موردی انتخاب نشده است
          </div>
        </aside>
      </main>

      {/* پنل پایین: وضعیت و لاگ‌ها */}
      <footer className={styles.femFooter}>
        <div className={styles.statusDot} />
        <span>Ready for 2D Mesh Generation</span>
      </footer>
    </div>
  );
}
