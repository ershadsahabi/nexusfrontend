// src/components/fem/FemHeader.tsx


'use client';

import styles from './FemHeader.module.css';

type Props = {
  projectUuid: string;
  femModelUuid: string;
};

export default function FemHeader({ projectUuid, femModelUuid }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.leftGroup}>
        <div className={styles.brandBlock}>
          <div className={styles.brandBadge}>FEM</div>
          <div className={styles.brandText}>
            <div className={styles.title}>Finite Element Workspace</div>
            <div className={styles.subtitle}>
              محیط مهندسی مستقل برای مدل‌سازی، بررسی و اتصال داده‌ها
            </div>
          </div>
        </div>
      </div>

      <div className={styles.centerGroup}>
        <div className={styles.metaPill}>
          <span className={styles.metaLabel}>Project</span>
          <span className={styles.metaValue}>{projectUuid}</span>
        </div>

        <div className={styles.metaPill}>
          <span className={styles.metaLabel}>Model</span>
          <span className={styles.metaValue}>{femModelUuid}</span>
        </div>
      </div>

      <div className={styles.rightGroup}>
        <div className={styles.statusChip}>
          <span className={styles.statusDot} />
          آماده توسعه
        </div>

        <button
          type="button"
          className={styles.ghostButton}
          onClick={() => window.close()}
        >
          بستن تب
        </button>
      </div>
    </header>
  );
}
