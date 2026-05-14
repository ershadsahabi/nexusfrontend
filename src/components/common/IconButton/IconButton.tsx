// components/common/IconButton/IconButton.tsx

'use client';

import React from 'react';
import styles from './IconButton.module.css';

type IconButtonVariant = 'ghost' | 'secondary' | 'primary' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  label: string;
};

export default function IconButton({
  variant = 'ghost',
  size = 'md',
  icon,
  label,
  className = '',
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={[styles.button, styles[variant], styles[size], className].join(' ')}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
