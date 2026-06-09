// src/components/fem/FemTopbar.tsx

'use client';

import styles from './FemTopbar.module.css';

export default function FemTopbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.item}>انتخاب</span>
        <span className={styles.item}>جابجایی</span>
        <span className={styles.item}>زوم</span>
      </div>

      <div className={styles.right}>
        <span className={styles.hint}>کلیک روی مقطع برای انتخاب</span>
      </div>
    </div>
  );
}
