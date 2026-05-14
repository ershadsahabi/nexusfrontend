// components/common/Field/Field.tsx

import React from 'react';
import styles from './Field.module.css';

type Props = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
};

export default function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
}: Props) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          <span>{label}</span>
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.control}>{children}</div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : hint ? (
        <div className={styles.hint}>{hint}</div>
      ) : null}
    </div>
  );
}
