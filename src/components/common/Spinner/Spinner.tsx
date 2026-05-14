// components/common/Spinner/Spinner.tsx

import React from 'react';
import styles from './Spinner.module.css';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  size?: Size;
  className?: string;
};

export default function Spinner({ size = 'md', className = '' }: Props) {
  return <span className={[styles.spinner, styles[size], className].join(' ')} aria-hidden="true" />;
}
