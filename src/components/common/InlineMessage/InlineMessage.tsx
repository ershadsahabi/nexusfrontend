// components/common/InlineMessage/InlineMessage.tsx


import React from 'react';
import styles from './InlineMessage.module.css';

type Variant = 'info' | 'success' | 'warning' | 'danger';

type Props = {
  variant?: Variant;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function InlineMessage({
  variant = 'info',
  title,
  children,
  className = '',
}: Props) {
  return (
    <div className={[styles.root, styles[variant], className].join(' ')}>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.text}>{children}</div>
      </div>
    </div>
  );
}
