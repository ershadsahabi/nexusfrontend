// src/components/fem/FemHeader.tsx

'use client';

import { useFemWorkspace } from './context/FemWorkspaceContext';
import styles from './FemHeader.module.css';

export default function FemHeader() {
  const { workspace } = useFemWorkspace();

  return (
    <header className={styles.header}>
      <div className={styles.main}>
        <div className={styles.title}>
          {workspace?.systemEntityName || 'FEM Workspace'}
        </div>
        <div className={styles.meta}>
          <span>کد: {workspace?.systemEntityCode || '—'}</span>
          <span className={styles.dot} />
          <span>Workspace: {workspace?.uuid?.slice(0, 8) || '—'}</span>
        </div>
      </div>

      <div className={styles.status}>متصل</div>
    </header>
  );
}
