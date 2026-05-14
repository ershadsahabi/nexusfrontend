// components/common/Badge/Badge.tsx


import React from 'react';
import styles from './Badge.module.css';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  subtle?: boolean;
  className?: string;
};

export default function Badge({
  children,
  variant = 'default',
  subtle = false,
  className = '',
}: Props) {
  return (
    <span
      className={[
        styles.badge,
        styles[variant],
        subtle ? styles.subtle : '',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
