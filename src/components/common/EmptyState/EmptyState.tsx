// components/common/EmptyState/EmptyState.tsx

import React from 'react';
import styles from './EmptyState.module.css';

type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className = '',
}: Props) {
  return (
    <div className={[styles.root, compact ? styles.compact : '', className].join(' ')}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}


