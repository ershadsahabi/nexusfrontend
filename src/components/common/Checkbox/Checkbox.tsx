//components/common/Checkbox/Checkbox.tsx


'use client';

import React from 'react';
import styles from './Checkbox.module.css';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: React.ReactNode;
};

export default function Checkbox({ label, className = '', ...props }: Props) {
  return (
    <label className={[styles.root, className].join(' ')}>
      <input className={styles.input} type="checkbox" {...props} />
      <span className={styles.box} aria-hidden="true">
        <span className={styles.check}>✓</span>
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
