// src/components/fem/FemLeftSidebar.tsx


'use client';

import styles from './FemLeftSidebar.module.css';

const treeItems = [
  {
    title: 'Model Root',
    meta: '1 مجموعه',
  },
  {
    title: 'Nodes',
    meta: '0 مورد',
  },
  {
    title: 'Elements',
    meta: '0 مورد',
  },
  {
    title: 'Materials',
    meta: '0 مورد',
  },
  {
    title: 'Sections',
    meta: '0 مورد',
  },
  {
    title: 'Boundary Conditions',
    meta: '0 مورد',
  },
  {
    title: 'Loads',
    meta: '0 مورد',
  },
  {
    title: 'Combinations',
    meta: '0 مورد',
  },
];

export default function FemLeftSidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Model Explorer</div>
          <div className={styles.subtitle}>ساختار سلسله‌مراتبی مدل FEM</div>
        </div>
        <button type="button" className={styles.iconButton}>
          +
        </button>
      </div>

      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          placeholder="جستجو در اجزای مدل..."
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>درخت مدل</div>

        <div className={styles.tree}>
          {treeItems.map((item, index) => (
            <button key={item.title} type="button" className={styles.treeItem}>
              <div className={styles.treeIcon}>{index === 0 ? '◈' : '•'}</div>
              <div className={styles.treeContent}>
                <div className={styles.treeTitle}>{item.title}</div>
                <div className={styles.treeMeta}>{item.meta}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
