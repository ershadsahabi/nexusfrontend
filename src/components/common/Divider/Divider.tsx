// components/common/Divider/Divider.tsx


import React from 'react';
import styles from './Divider.module.css';

type Props = {
  label?: React.ReactNode;
  className?: string;
};

export default function Divider({ label, className = '' }: Props) {
  if (!label) {
    return <hr className={[styles.divider, className].join(' ')} />;
  }

  return (
    <div className={[styles.withLabel, className].join(' ')}>
      <span className={styles.line} />
      <span className={styles.label}>{label}</span>
      <span className={styles.line} />
    </div>
  );
}


