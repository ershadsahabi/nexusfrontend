// src\components\common\Input\Input.tsx

'use client';

import React from 'react';
import styles from './Input.module.css';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  invalid?: boolean;
};

export default function Input({
  leftSlot,
  rightSlot,
  invalid = false,
  className = '',
  ...props
}: Props) {
  return (
    <div
      className={[
        styles.wrapper,
        invalid ? styles.invalid : '',
        leftSlot ? styles.withLeftSlot : '',
        rightSlot ? styles.withRightSlot : '',
        className,
      ].join(' ')}
    >
      {leftSlot && <span className={styles.slotLeft}>{leftSlot}</span>}
      <input className={styles.input} {...props} />
      {rightSlot && <span className={styles.slotRight}>{rightSlot}</span>}
    </div>
  );
}
