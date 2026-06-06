// src/components/fem/FemTopbar.tsx

'use client';

import styles from './FemTopbar.module.css';

const toolGroups = {
  select: ['انتخاب', 'پیمایش', 'قفل نما'],
  draw: ['گره', 'المان', 'تکیه‌گاه', 'بار'],
  inspect: ['اندازه‌گیری', 'بررسی', 'نمایش شناسه'],
  view: ['Grid', 'Snap', 'Axes', 'Mini Map'],
};

export default function FemTopbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.group}>
        <span className={styles.groupLabel}>ابزارهای پایه</span>
        <div className={styles.actions}>
          {toolGroups.select.map((item) => (
            <button key={item} type="button" className={styles.toolButton}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <span className={styles.groupLabel}>مدل‌سازی</span>
        <div className={styles.actions}>
          {toolGroups.draw.map((item) => (
            <button key={item} type="button" className={styles.toolButton}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <span className={styles.groupLabel}>بازبینی</span>
        <div className={styles.actions}>
          {toolGroups.inspect.map((item) => (
            <button key={item} type="button" className={styles.toolButton}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.inlineToggles}>
        {toolGroups.view.map((item) => (
          <button key={item} type="button" className={styles.pillButton}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
