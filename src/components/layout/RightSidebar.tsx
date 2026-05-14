// src/components/layout/RightSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

type NavItem = {
  name: string;
  path: string;
  description: string;
};

export const RightSidebar = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      name: 'داشبورد',
      path: '/dashboard',
      description: 'نمای کلی پروژه‌ها',
    },
    {
      name: 'پروژه‌ها',
      path: '/projects',
      description: 'مدیریت پروژه‌های مهندسی',
    },
    {
      name: 'گراف‌ها و بوم',
      path: '/workspace',
      description: 'مدل‌سازی و ارتباط سیستم‌ها',
    },
    {
      name: 'تنظیمات',
      path: '/settings',
      description: 'پیکربندی محیط کاری',
    },
  ];

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarEyebrow}>Navigation</span>
        <h3 className={styles.sidebarTitle}>منوی اصلی</h3>
      </div>

      <nav className={styles.sidebarNav} aria-label="Main navigation">
        <ul>
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname?.startsWith(`${item.path}/`);

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`${styles.navLink} ${
                    isActive ? styles.activeNavLink : ''
                  }`}
                >
                  <span className={styles.navIndicator} />

                  <span className={styles.navText}>
                    <span className={styles.navName}>{item.name}</span>
                    <span className={styles.navDescription}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarFooterCard}>
          <span className={styles.footerLabel}>Workspace Mode</span>
          <strong>CAD / Graph View</strong>
        </div>
      </div>
    </aside>
  );
};
