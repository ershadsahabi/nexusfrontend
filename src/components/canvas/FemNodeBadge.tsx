// src/components/canvas/FemNodeBadge.tsx

'use client';

import { CheckCircle2, PlusCircle } from 'lucide-react';

import type { CanvasFemStatus } from '@/lib/types/canvas.types';

import styles from './FemNodeBadge.module.css';

type FemNodeBadgeProps = {
  status: CanvasFemStatus | null;
};

export default function FemNodeBadge({ status }: FemNodeBadgeProps) {
  if (!status) return null;

  /**
   * برای نودهایی که FEM-eligible نیستند، Badge نشان نمی‌دهیم
   * تا Canvas شلوغ نشود.
   */
  if (!status.femEligible) return null;

  if (status.hasFemModel) {
    return (
      <span
        className={`${styles.badge} ${styles.badgeLinked}`}
        title="مدل FEM برای این موجودیت وجود دارد"
      >
        <CheckCircle2 className={styles.icon} />
        <span>FEM</span>
      </span>
    );
  }

  return (
    <span
      className={`${styles.badge} ${styles.badgeAvailable}`}
      title="این موجودیت قابلیت اتصال به مدل FEM دارد"
    >
      <PlusCircle className={styles.icon} />
      <span>FEM</span>
    </span>
  );
}
    