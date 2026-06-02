// src/components/layout/RightSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import styles from './SharedLayout.module.css';

type NavItem = {
  name: string;
  path: string;
  description: string;
  icon: string;
  code: string;
};

type SidebarState = {
  width?: number;
  collapsed?: boolean;
};

const STORAGE_KEY = 'nexus.layout.rightSidebar.v1';

const DEFAULT_WIDTH = 232;
const MIN_WIDTH = 196;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 72;

export const RightSidebar = () => {
  const pathname = usePathname();

  const isWorkspaceRoute = pathname === '/workspace' || pathname?.startsWith('/workspace/');

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_WIDTH);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        name: 'داشبورد',
        path: '/dashboard',
        description: 'نمای کلی',
        icon: '◈',
        code: 'DB',
      },
      {
        name: 'پروژه‌ها',
        path: '/projects',
        description: 'مدیریت منابع',
        icon: '▦',
        code: 'PR',
      },
      {
        name: 'گراف سیستم',
        path: '/workspace',
        description: 'محیط مدل‌سازی',
        icon: '⌘',
        code: 'GX',
      },
      {
        name: 'تنظیمات',
        path: '/settings',
        description: 'پیکربندی هسته',
        icon: '⚙',
        code: 'ST',
      },
    ],
    []
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        /**
         * رفتار پیش‌فرض:
         * در Workspace سایدبار مینیمایز باشد تا Canvas فضای بیشتری داشته باشد.
         * در باقی صفحات باز باشد.
         */
        setCollapsed(!!isWorkspaceRoute);
        return;
      }

      const parsed = JSON.parse(raw) as SidebarState;

      if (typeof parsed.width === 'number') {
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width)));
      }

      if (typeof parsed.collapsed === 'boolean') {
        setCollapsed(parsed.collapsed);
      }
    } catch {
      setCollapsed(!!isWorkspaceRoute);
    }
  }, [isWorkspaceRoute]);

  useEffect(() => {
    try {
      const payload: SidebarState = {
        width,
        collapsed,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [width, collapsed]);

  useEffect(() => {
    if (!isResizing || collapsed) return;

    const handlePointerMove = (event: PointerEvent) => {
      /**
       * چون سایدبار سمت راست است، وقتی موس به چپ حرکت کند،
       * عرض باید زیاد شود.
       */
      const deltaX = resizeStartXRef.current - event.clientX;
      const nextWidth = resizeStartWidthRef.current + deltaX;

      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, nextWidth)));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, collapsed]);

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (collapsed) return;

    event.preventDefault();
    event.stopPropagation();

    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = width;

    setIsResizing(true);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <aside
      className={[
        styles.rightSidebar,
        collapsed ? styles.rightSidebarCollapsed : '',
        isResizing ? styles.rightSidebarResizing : '',
      ].join(' ')}
      style={{
        width: collapsed ? COLLAPSED_WIDTH : width,
      }}
      aria-label="System navigation"
    >
      {!collapsed && (
        <div
          className={styles.sidebarResizeHandle}
          onPointerDown={handleResizeStart}
          title="تغییر عرض سایدبار"
        />
      )}

      <button
        type="button"
        className={styles.sidebarCollapseButton}
        onClick={handleToggleCollapsed}
        title={collapsed ? 'باز کردن منو' : 'مینیمایز کردن منو'}
        aria-label={collapsed ? 'باز کردن منو' : 'مینیمایز کردن منو'}
      >
        <span className={styles.sidebarCollapseIcon}>
          {collapsed ? '‹' : '›'}
        </span>
      </button>

      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarCoreMark}>
          <span>NX</span>
        </div>

        <div className={styles.sidebarHeaderText}>
          <span className={styles.sidebarEyebrow}>Nav // Core</span>
          <h3 className={styles.sidebarTitle}>منوی سیستم</h3>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.path || pathname?.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              href={item.path}
              title={collapsed ? item.name : undefined}
              className={[
                styles.navLink,
                isActive ? styles.activeNavLink : '',
              ].join(' ')}
            >
              <span className={styles.navIconWrap}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navCode}>{item.code}</span>
              </span>

              <span className={styles.navText}>
                <span className={styles.navName}>{item.name}</span>
                <span className={styles.navDescription}>{item.description}</span>
              </span>

              <span className={styles.navIndicator} />
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarFooterCard}>
          <span className={styles.footerLabel}>MODE //</span>
          <strong>CAD / Simulation</strong>
          <span className={styles.footerSubLabel}>Adaptive Workspace</span>
        </div>
      </div>
    </aside>
  );
};
