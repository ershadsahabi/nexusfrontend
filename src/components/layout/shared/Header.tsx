// src/components/layout/Header.tsx

'use client';

import { useLogout } from '@/hooks/useLogout';
import styles from './SharedLayout.module.css';

export const Header = () => {
  const logout = useLogout();

  return (
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        <div className={styles.logoMark}>NX</div>
        <div className={styles.brandText}>
          <span className={styles.logo}>NEXUS ENGINE</span>
          <span className={styles.logoSubtitle}>v3.0 // AI Simulation</span>
        </div>
      </div>

      <div className={styles.headerCenter}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          SYSTEM ONLINE
        </div>
      </div>

      <div className={styles.userActions}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Administrator</span>
          <span className={styles.userRole}>SEC-LEVEL 4</span>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          LOGOUT
        </button>
      </div>
    </header>
  );
};
