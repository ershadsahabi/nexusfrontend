// src/components/cad/CadRightSidebar.tsx

'use client';

import { useCadWorkspace } from './context/CadWorkspaceContext';
import styles from './CadWorkspaceShell.module.css';

export default function CadRightSidebar() {
  const { workspace } = useCadWorkspace();

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span>مشخصات</span>
      </div>

      <div className={styles.propertyList}>
        <Property label="نوع Workspace" value="CAD" />
        <Property label="نام تجهیز" value={workspace?.systemEntityName || '-'} />
        <Property label="کد تجهیز" value={workspace?.systemEntityCode || '-'} />
        <Property label="UUID" value={workspace?.uuid || '-'} mono />
      </div>
    </div>
  );
}

function Property({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.propertyRow}>
      <span>{label}</span>
      <strong className={mono ? styles.monoValue : undefined}>{value}</strong>
    </div>
  );
}
