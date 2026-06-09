// src/components/cad/CadHeader.tsx

'use client';

import { useCadWorkspace } from './context/CadWorkspaceContext';
import styles from './CadWorkspaceShell.module.css';

export default function CadHeader() {
  const { workspace, title, shortUuid } = useCadWorkspace();

  return (
    <header className={styles.header}>
      <div className={styles.headerGroup}>
        <div className={styles.brandBadge}>CAD</div>

        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            {workspace?.systemEntityCode || 'بدون کد'} · Workspace #{shortUuid}
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <span className={styles.statusChip}>
          <span className={styles.statusDot} />
          آماده طراحی
        </span>

        <button className={styles.primaryButton} type="button">
          ذخیره مدل
        </button>
      </div>
    </header>
  );
}
