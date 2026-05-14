// components/common/Select/Select.tsx


'use client';

import React from 'react';
import styles from './Select.module.css';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export default function Select({
  invalid = false,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <div className={[styles.wrapper, invalid ? styles.invalid : '', className].join(' ')}>
      <select className={styles.select} {...props}>
        {children}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        ▾
      </span>
    </div>
  );
}
