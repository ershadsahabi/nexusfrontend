// src/components/fem/FemRightSidebar.tsx

'use client';

import styles from './FemRightSidebar.module.css';

const infoBlocks = [
  {
    title: 'Selection Inspector',
    rows: [
      ['وضعیت', 'بدون انتخاب'],
      ['نوع', '—'],
      ['شناسه', '—'],
      ['مختصات', '—'],
    ],
  },
  {
    title: 'Display Settings',
    rows: [
      ['Grid', 'فعال'],
      ['Snap', 'غیرفعال'],
      ['Axes', 'فعال'],
      ['Precision', '0.001'],
    ],
  },
  {
    title: 'Model Summary',
    rows: [
      ['Nodes', '0'],
      ['Elements', '0'],
      ['Materials', '0'],
      ['Loads', '0'],
    ],
  },
];

export default function FemRightSidebar() {
  return (
    <div className={styles.sidebar}>
      {infoBlocks.map((block) => (
        <section key={block.title} className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{block.title}</h3>
            <span className={styles.cardDot} />
          </div>

          <div className={styles.rows}>
            {block.rows.map(([label, value]) => (
              <div key={label} className={styles.row}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
