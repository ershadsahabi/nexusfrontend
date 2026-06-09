// src/components/fem/FemLeftSidebar.tsx

'use client';

import { useFemSectionEditor } from './context/FemSectionEditorContext';
import styles from './FemLeftSidebar.module.css';

export default function FemLeftSidebar() {
  const { section, draft, issues } = useFemSectionEditor();

  return (
    <div className={styles.sidebar}>
      <section className={styles.card}>
        <div className={styles.cardTitle}>اطلاعات مقطع</div>

        <div className={styles.list}>
          <Row label="نام" value={draft?.label || section?.label || '—'} />
          <Row label="نوع" value={draft?.kind || section?.kind || '—'} />
          <Row label="واحد" value={draft?.units || section?.units || '—'} />
          <Row label="منبع" value={section?.source || '—'} />
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitle}>وضعیت</div>

        <div className={styles.list}>
          <Row label="Issue Count" value={String(issues.length)} />
          <Row
            label="Selection"
            value={section ? 'Section Ready' : 'Not Ready'}
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
