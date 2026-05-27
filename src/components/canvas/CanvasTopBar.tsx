// src/components/canvas/CanvasTopBar.tsx

'use client';

import type { ReactNode } from 'react';
import styles from './CanvasTopBar.module.css';

type CanvasTopBarProps = {
  children: ReactNode;
  className?: string;
};

export default function CanvasTopBar({
  children,
  className,
}: CanvasTopBarProps) {
  return (
    <div className={`${styles.topBar} ${className ?? ''}`}>
      <div className={styles.rail}>
        <div className={styles.railScroller}>
          {children}
        </div>
      </div>
    </div>
  );
}
