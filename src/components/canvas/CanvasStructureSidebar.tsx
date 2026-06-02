// src/components/canvas/CanvasStructureSidebar.tsx

'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import RootSystemSelector from './RootSystemSelector';
import HierarchyDropdown from './HierarchyDropdown';

import styles from './CanvasStructureSidebar.module.css';

// پیکربندی ابعاد و فواصل
const DEFAULT_WIDTH = 336;
const MIN_WIDTH = 280;
const MAX_WIDTH = 560;

const COLLAPSED_WIDTH = 58;
const COLLAPSED_HEIGHT = 58;

const DEFAULT_TOP = 88;
const DEFAULT_RIGHT = 18;
const MIN_TOP = 12;
const MIN_RIGHT = 12;
const MIN_BOTTOM_GAP = 12;

// موقعیت ثابت برای حالت مینیمایز (FAB)
const SNAP_TOP = 88;
const SNAP_RIGHT = 18;

const STORAGE_KEY = 'nexus.canvas.structureSidebar.v3';

type SavedState = {
  width?: number;
  top?: number;
  right?: number;
  collapsed?: boolean;
};

export default function CanvasStructureSidebar() {
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [top, setTop] = useState(DEFAULT_TOP);
  const [right, setRight] = useState(DEFAULT_RIGHT);


  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_WIDTH);

  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTopRef = useRef(DEFAULT_TOP);
  const dragStartRightRef = useRef(DEFAULT_RIGHT);

  // ۱. بارگذاری وضعیت (Hydration)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as SavedState;
      const wasCollapsed = !!parsed.collapsed;

      if (typeof parsed.width === 'number') {
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width)));
      }

      if (wasCollapsed) {
        // اگر مینیمایز بود، حتماً در جای ثابت نمایش بده
        setTop(SNAP_TOP);
        setRight(SNAP_RIGHT);
        setCollapsed(true);
      } else {
        if (typeof parsed.top === 'number') setTop(Math.max(MIN_TOP, parsed.top));
        if (typeof parsed.right === 'number') setRight(Math.max(MIN_RIGHT, parsed.right));
        setCollapsed(false);
      }
    } catch (e) {
      console.error('Failed to load sidebar state', e);
    }
  }, []);

  // ۲. ذخیره‌سازی خودکار وضعیت
  useEffect(() => {
    try {
      const payload: SavedState = { width, top, right, collapsed };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }, [width, top, right, collapsed]);

  // ۳. منطق تغییر عرض (Resize)
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = resizeStartXRef.current - event.clientX;
      const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidthRef.current + deltaX));
      setWidth(nextWidth);
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
  }, [isResizing]);

  // ۴. منطق جابه‌جایی (Drag) - فقط در حالت باز
  useEffect(() => {
    if (!isDragging || collapsed) return;

    const handlePointerMove = (event: PointerEvent) => {
      const parentEl = sidebarRef.current?.parentElement;
      if (!parentEl) return;

      const parentRect = parentEl.getBoundingClientRect();
      const currentHeight = sidebarRef.current?.offsetHeight || 0;

      const deltaX = event.clientX - dragStartXRef.current;
      const deltaY = event.clientY - dragStartYRef.current;

      let nextRight = dragStartRightRef.current - deltaX;
      let nextTop = dragStartTopRef.current + deltaY;

      const maxRight = parentRect.width - width - 12;
      const maxTop = parentRect.height - currentHeight - MIN_BOTTOM_GAP;

      setRight(Math.max(MIN_RIGHT, Math.min(maxRight, nextRight)));
      setTop(Math.max(MIN_TOP, Math.min(maxTop, nextTop)));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, collapsed, width]);

  // ۵. اکشن‌های کنترلی
  const handleDragStart = (event: ReactPointerEvent) => {
    if ((event.target as HTMLElement).closest('button')) return;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartTopRef.current = top;
    dragStartRightRef.current = right;
    setIsDragging(true);
    document.body.style.cursor = 'move';
  };

  const handleResizeStart = (event: ReactPointerEvent) => {
    event.stopPropagation();
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = width;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleMinimize = () => {
    setTop(SNAP_TOP);
    setRight(SNAP_RIGHT);
    setCollapsed(true);
  };

  const handleExpand = () => {
    setCollapsed(false);
  };

  return (
    <aside
      ref={sidebarRef}
      className={[
        styles.sidebar,
        collapsed ? styles.sidebarCollapsed : '',
        isDragging ? styles.sidebarDragging : '',
        isResizing ? styles.sidebarResizing : '',
      ].join(' ')}
      style={{
        width: collapsed ? COLLAPSED_WIDTH : width,
        height: collapsed ? COLLAPSED_HEIGHT : undefined,
        top,
        right,
      }}
      dir="rtl"
    >
      {!collapsed ? (
        <>
          <div className={styles.resizeHandle} onPointerDown={handleResizeStart} />
          <div className={styles.sidebarInner}>
            <header className={styles.header} onPointerDown={handleDragStart}>
              <div className={styles.headerMain}>
                <div className={styles.headerIcon}><TreeIcon /></div>
                <div className={styles.headerText}>
                  <span className={styles.title}>ساختار سیستم</span>
                  <span className={styles.subtitle}>پنل مرور و انتخاب</span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.headerButton} onClick={handleMinimize} title="Minimize">—</button>
              </div>
            </header>

            <div className={styles.content}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionMeta}>
                    <span className={styles.sectionBadge}>01</span>
                    <span className={styles.sectionLabel}>سیستم فعال</span>
                  </div>
                </div>
                <div className={styles.selectorWrap}><RootSystemSelector /></div>
              </section>

              <section className={`${styles.section} ${styles.hierarchySection}`}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionMeta}>
                    <span className={styles.sectionBadge}>02</span>
                    <span className={styles.sectionLabel}>سلسله‌مراتب</span>
                  </div>
                </div>
                <div className={styles.hierarchyWrap}><HierarchyDropdown /></div>
              </section>
            </div>
          </div>
        </>
      ) : (
        <button className={styles.structureFab} onClick={handleExpand} title="Open Structure">
          <span className={styles.structureFabGlow} />
          <span className={styles.structureFabIcon}><TreeIcon /></span>
          <span className={styles.structureFabDot} />
        </button>
      )}
    </aside>
  );
}

function TreeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 4.5V9.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 13.25V11.8C7 10.4 8.15 9.25 9.55 9.25H14.45C15.85 9.25 17 10.4 17 11.8V13.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8.75" y="2.75" width="6.5" height="3.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3.75" y="13.25" width="6.5" height="5.75" rx="1.35" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13.75" y="13.25" width="6.5" height="5.75" rx="1.35" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
