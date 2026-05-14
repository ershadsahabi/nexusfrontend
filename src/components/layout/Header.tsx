// src/components/layout/Header.tsx

'use client';

import { useLogout } from '@/hooks/useLogout';
import styles from './layout.module.css';

export const Header = () => {
  const logout = useLogout();

  return (
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        <div className={styles.logoMark}>N</div>

        <div className={styles.brandText}>
          <span className={styles.logo}>Nexus Workspace</span>
          <span className={styles.logoSubtitle}>Engineering Simulation Platform</span>
        </div>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          محیط کاری فعال
        </div>
      </div>

      <div className={styles.userActions}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>کاربر مهندس</span>
          <span className={styles.userRole}>Engineering User</span>
        </div>

        <button onClick={logout} className={styles.logoutBtn}>
          خروج
        </button>
      </div>
    </header>
  );
};
