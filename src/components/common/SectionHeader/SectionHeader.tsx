// components/common/SectionHeader/SectionHeader.tsx

import React from 'react';
import styles from './SectionHeader.module.css';

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  actions,
  className = '',
}: Props) {
  return (
    <div className={[styles.root, className].join(' ')}>
      <div className={styles.texts}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
