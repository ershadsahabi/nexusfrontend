// components/common/Switch/Switch.tsx


'use client';

import React from 'react';
import styles from './Switch.module.css';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: React.ReactNode;
};

export default function Switch({ label, className = '', ...props }: Props) {
  return (
    <label className={[styles.root, className].join(' ')}>
      <input className={styles.input} type="checkbox" {...props} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}



