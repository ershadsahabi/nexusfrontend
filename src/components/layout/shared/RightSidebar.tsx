// src/components/layout/RightSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SharedLayout.module.css';

type NavItem = {
  name: string;
  path: string;
  description: string;
};

export const RightSidebar = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'داشبورد', path: '/dashboard', description: 'نمای کلی' },
    { name: 'پروژه‌ها', path: '/projects', description: 'مدیریت منابع' },
    { name: 'گراف سیستم', path: '/workspace', description: 'محیط مدل‌سازی' },
    { name: 'تنظیمات', path: '/settings', description: 'پیکربندی هسته' },
  ];

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarEyebrow}>Nav // Core</span>
        <h3 className={styles.sidebarTitle}>منوی سیستم</h3>
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
            >
              <span className={styles.navIndicator} />
              <span className={styles.navText}>
                <span>{item.name}</span>
                <span className={styles.navDescription}>{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarFooterCard}>
          <span className={styles.footerLabel}>MODE //</span>
          <strong>CAD / Simulation</strong>
        </div>
      </div>
    </aside>
  );
};
