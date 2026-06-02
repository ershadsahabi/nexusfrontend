// src/components/layout/WorkspaceLayout.tsx

'use client';

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { Header } from './shared/Header';
import { PropertiesPanel } from './PropertiesPanel';
import { RightSidebar } from './shared/RightSidebar';

import styles from './WorkspaceLayout.module.css';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

type InspectorState = {
  width?: number;
  collapsed?: boolean;
};

const STORAGE_KEY = 'nexus.workspace.propertiesPanel.v3';

const DEFAULT_WIDTH = 320; 
const MIN_WIDTH = 300;
const MAX_WIDTH = 480;
const COLLAPSED_WIDTH = 60;

export const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => {
  // مقدار اولیه استیت روی TRUE (بسته) است برای هماهنگی با اولین اجرا
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(true); 
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_WIDTH);

  // منطق لود اولیه: فقط یکبار در زمان Mount شدن اجرا می‌شود
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InspectorState;
        
        // بازیابی عرض ذخیره شده
        if (typeof parsed.width === 'number') {
          setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width)));
        }
        
        // بازیابی وضعیت باز/بسته (اگر قبلا کاربر تغییری داده باشد)
        if (typeof parsed.collapsed === 'boolean') {
          setCollapsed(parsed.collapsed);
        }
      } else {
        // اگر هیچ دیتایی نبود (اولین اجرای کلین)، حتما بسته بماند
        setCollapsed(true);
      }
    } catch (e) {
      console.warn("Failed to load workspace state:", e);
    } finally {
      // استفاده از یک تاخیر بسیار ناچیز برای اتمام محاسبات عرض توسط مرورگر
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    }
  }, []);

  // منطق ذخیره‌سازی: با هر تغییر وضعیت
  useEffect(() => {
    if (!isMounted) return;
    try {
      const payload: InspectorState = { width, collapsed };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { /* ignore */ }
  }, [width, collapsed, isMounted]);

  // منطق تغییر اندازه (Resize)
  useEffect(() => {
    if (!isResizing || collapsed) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - resizeStartXRef.current;
      const nextWidth = resizeStartWidthRef.current + deltaX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, nextWidth)));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, collapsed]);

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (collapsed) return;
    event.preventDefault();
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = width;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleToggle = () => setCollapsed((p) => !p);

  return (
    <div className={styles.workspaceContainer} dir="rtl">
      <Header />

      <div className={styles.mainContent}>
        <RightSidebar />
        <main className={styles.canvasArea}>{children}</main>

        <aside
          className={[
            styles.leftSidebar,
            collapsed ? styles.leftSidebarCollapsed : '',
            isResizing ? styles.leftSidebarResizing : '',
            !isMounted ? styles.isInitialLoad : '', 
          ].join(' ')}
          style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
        >
          {/* هندل تغییر اندازه فقط در حالت باز */}
          {!collapsed && (
            <div className={styles.resizeHandle} onPointerDown={handleResizeStart} />
          )}

          {/* دکمه مدیریت وضعیت */}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={handleToggle}
            aria-label={collapsed ? "Open Properties" : "Close Properties"}
          >
            <span className={styles.toggleIcon}>{collapsed ? '›' : '‹'}</span>
          </button>

          <div className={styles.panelContentWrapper}>
            {/* 
               شرط isMounted تضمین می‌کند که تا زمان خواندن دیتا از localStorage،
               هیچ محتوایی رندر نشود تا از پرش بصری (Popping) جلوگیری شود.
            */}
            {isMounted && (
              <>
                {collapsed ? (
                  <div className={styles.railView}>
                    <span className={styles.railLabel}>INSPECTOR</span>
                    <span className={styles.railCode}>PRP</span>
                  </div>
                ) : (
                  <div className={styles.fullView}>
                    <PropertiesPanel />
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
