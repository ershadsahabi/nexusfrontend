// src/components/canvas/CanvasStructureSidebar.tsx

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import RootSystemSelector from './RootSystemSelector';
import HierarchyDropdown from './HierarchyDropdown';

import styles from './CanvasStructureSidebar.module.css';

const DEFAULT_WIDTH = 356;
const MIN_WIDTH = 286;
const MAX_WIDTH = 620;

const DEFAULT_HEIGHT = 540;
const MIN_HEIGHT = 360;
const MAX_HEIGHT = 760;

const COLLAPSED_WIDTH = 58;
const COLLAPSED_HEIGHT = 58;

const DEFAULT_TOP = 88;
const DEFAULT_RIGHT = 18;

const MIN_TOP = 12;
const MIN_RIGHT = 12;
const MIN_LEFT_GAP = 12;
const MIN_BOTTOM_GAP = 12;

const SNAP_TOP = 88;
const SNAP_RIGHT = 18;

const STORAGE_KEY = 'nexus.canvas.structureSidebar.v5';

type InteractionMode = 'idle' | 'dragging' | 'resize-width' | 'resize-height';

type SavedState = {
  width?: number;
  height?: number;
  top?: number;
  right?: number;
  collapsed?: boolean;
};

type Bounds = {
  maxWidth: number;
  maxHeight: number;
  maxTop: number;
  maxRight: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;

  return target.closest(
    [
      'button',
      'a',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[data-no-drag="true"]',
      '[data-resize-handle="true"]',
    ].join(',')
  );
}

export default function CanvasStructureSidebar() {
  const sidebarRef = useRef<HTMLElement | null>(null);
  const hasHydratedRef = useRef(false);

  const [collapsed, setCollapsed] = useState(true);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [top, setTop] = useState(DEFAULT_TOP);
  const [right, setRight] = useState(DEFAULT_RIGHT);
  const [mode, setMode] = useState<InteractionMode>('idle');

  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_WIDTH);

  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(DEFAULT_HEIGHT);

  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTopRef = useRef(DEFAULT_TOP);
  const dragStartRightRef = useRef(DEFAULT_RIGHT);

  const isDragging = mode === 'dragging';
  const isResizingWidth = mode === 'resize-width';
  const isResizingHeight = mode === 'resize-height';
  const isInteracting = mode !== 'idle';

  const getBounds = useCallback(
    (nextTop = top, nextRight = right, nextWidth = width, nextHeight = height): Bounds => {
      const parentEl = sidebarRef.current?.parentElement;

      if (!parentEl) {
        return {
          maxWidth: MAX_WIDTH,
          maxHeight: MAX_HEIGHT,
          maxTop: MAX_HEIGHT,
          maxRight: MAX_WIDTH,
        };
      }

      const parentRect = parentEl.getBoundingClientRect();

      const availableWidth = parentRect.width - nextRight - MIN_LEFT_GAP;
      const availableHeight = parentRect.height - nextTop - MIN_BOTTOM_GAP;

      const maxWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, availableWidth)
      );

      const maxHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, availableHeight)
      );

      const maxRight = Math.max(
        MIN_RIGHT,
        parentRect.width - nextWidth - MIN_LEFT_GAP
      );

      const maxTop = Math.max(
        MIN_TOP,
        parentRect.height - nextHeight - MIN_BOTTOM_GAP
      );

      return {
        maxWidth,
        maxHeight,
        maxTop,
        maxRight,
      };
    },
    [height, right, top, width]
  );

  const normalizeLayout = useCallback(() => {
    if (collapsed) return;

    const parentEl = sidebarRef.current?.parentElement;
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();

    setWidth((prevWidth) => {
      const maxWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, parentRect.width - right - MIN_LEFT_GAP)
      );

      return clamp(prevWidth, MIN_WIDTH, maxWidth);
    });

    setHeight((prevHeight) => {
      const maxHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, parentRect.height - top - MIN_BOTTOM_GAP)
      );

      return clamp(prevHeight, MIN_HEIGHT, maxHeight);
    });

    setRight((prevRight) => {
      const maxRight = Math.max(
        MIN_RIGHT,
        parentRect.width - width - MIN_LEFT_GAP
      );

      return clamp(prevRight, MIN_RIGHT, maxRight);
    });

    setTop((prevTop) => {
      const maxTop = Math.max(
        MIN_TOP,
        parentRect.height - height - MIN_BOTTOM_GAP
      );

      return clamp(prevTop, MIN_TOP, maxTop);
    });
  }, [collapsed, height, right, top, width]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        hasHydratedRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as SavedState;

      const nextWidth = isFiniteNumber(parsed.width)
        ? clamp(parsed.width, MIN_WIDTH, MAX_WIDTH)
        : DEFAULT_WIDTH;

      const nextHeight = isFiniteNumber(parsed.height)
        ? clamp(parsed.height, MIN_HEIGHT, MAX_HEIGHT)
        : DEFAULT_HEIGHT;

      setWidth(nextWidth);
      setHeight(nextHeight);

      if (parsed.collapsed) {
        setTop(SNAP_TOP);
        setRight(SNAP_RIGHT);
        setCollapsed(true);
      } else {
        setTop(
          isFiniteNumber(parsed.top)
            ? Math.max(MIN_TOP, parsed.top)
            : DEFAULT_TOP
        );

        setRight(
          isFiniteNumber(parsed.right)
            ? Math.max(MIN_RIGHT, parsed.right)
            : DEFAULT_RIGHT
        );

        setCollapsed(false);
      }
    } catch (error) {
      console.error('Failed to load structure sidebar state:', error);
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    try {
      const payload: SavedState = {
        width,
        height,
        top,
        right,
        collapsed,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage can fail in private mode / restricted environments.
    }
  }, [collapsed, height, right, top, width]);

  useEffect(() => {
    if (mode !== 'resize-width') return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = resizeStartXRef.current - event.clientX;
      const rawWidth = resizeStartWidthRef.current + deltaX;

      const bounds = getBounds(top, right, rawWidth, height);
      const nextWidth = clamp(rawWidth, MIN_WIDTH, bounds.maxWidth);

      setWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setMode('idle');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [getBounds, height, mode, right, top]);

  useEffect(() => {
    if (mode !== 'resize-height') return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaY = event.clientY - resizeStartYRef.current;
      const rawHeight = resizeStartHeightRef.current + deltaY;

      const bounds = getBounds(top, right, width, rawHeight);
      const nextHeight = clamp(rawHeight, MIN_HEIGHT, bounds.maxHeight);

      setHeight(nextHeight);
    };

    const handlePointerUp = () => {
      setMode('idle');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [getBounds, mode, right, top, width]);

  useEffect(() => {
    if (mode !== 'dragging' || collapsed) return;

    const handlePointerMove = (event: PointerEvent) => {
      const parentEl = sidebarRef.current?.parentElement;
      if (!parentEl) return;

      const parentRect = parentEl.getBoundingClientRect();

      const deltaX = event.clientX - dragStartXRef.current;
      const deltaY = event.clientY - dragStartYRef.current;

      const rawRight = dragStartRightRef.current - deltaX;
      const rawTop = dragStartTopRef.current + deltaY;

      const maxRight = Math.max(
        MIN_RIGHT,
        parentRect.width - width - MIN_LEFT_GAP
      );

      const maxTop = Math.max(
        MIN_TOP,
        parentRect.height - height - MIN_BOTTOM_GAP
      );

      setRight(clamp(rawRight, MIN_RIGHT, maxRight));
      setTop(clamp(rawTop, MIN_TOP, maxTop));
    };

    const handlePointerUp = () => {
      setMode('idle');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [collapsed, height, mode, width]);

  useEffect(() => {
    if (collapsed) return;

    window.addEventListener('resize', normalizeLayout);
    normalizeLayout();

    return () => {
      window.removeEventListener('resize', normalizeLayout);
    };
  }, [collapsed, normalizeLayout]);

  useEffect(() => {
    if (collapsed) return;

    const parentEl = sidebarRef.current?.parentElement;
    if (!parentEl || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      normalizeLayout();
    });

    observer.observe(parentEl);

    return () => {
      observer.disconnect();
    };
  }, [collapsed, normalizeLayout]);

  const shellClassName = useMemo(
    () =>
      [
        styles.sidebar,
        collapsed ? styles.sidebarCollapsed : '',
        isDragging ? styles.sidebarDragging : '',
        isInteracting ? styles.sidebarInteracting : '',
        isResizingWidth ? styles.sidebarWidthResizing : '',
        isResizingHeight ? styles.sidebarHeightResizing : '',
      ]
        .filter(Boolean)
        .join(' '),
    [
      collapsed,
      isDragging,
      isInteracting,
      isResizingHeight,
      isResizingWidth,
    ]
  );

  const handleDragStart = (event: ReactPointerEvent<HTMLElement>) => {
    if (collapsed) return;
    if (event.button !== 0) return;
    if (getInteractiveTarget(event.target)) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartTopRef.current = top;
    dragStartRightRef.current = right;

    setMode('dragging');
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';
  };

  const handleWidthResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = width;

    setMode('resize-width');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleHeightResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    resizeStartYRef.current = event.clientY;
    resizeStartHeightRef.current = height;

    setMode('resize-height');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResetWidth = () => {
    const bounds = getBounds(top, right, DEFAULT_WIDTH, height);
    setWidth(clamp(DEFAULT_WIDTH, MIN_WIDTH, bounds.maxWidth));
  };

  const handleMaximizeHeight = () => {
    const bounds = getBounds(top, right, width, MAX_HEIGHT);
    setHeight(bounds.maxHeight);
  };

  const handleMinimize = () => {
    setMode('idle');
    setTop(SNAP_TOP);
    setRight(SNAP_RIGHT);
    setCollapsed(true);
  };

  const handleExpand = () => {
    setCollapsed(false);

    window.requestAnimationFrame(() => {
      normalizeLayout();
    });
  };

  return (
    <aside
      ref={sidebarRef}
      className={shellClassName}
      style={{
        width: collapsed ? COLLAPSED_WIDTH : width,
        height: collapsed ? COLLAPSED_HEIGHT : height,
        top,
        right,
      }}
      dir="rtl"
      aria-label="Structure sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {!collapsed ? (
        <>
          <div
            className={styles.resizeHandle}
            data-resize-handle="true"
            onPointerDown={handleWidthResizeStart}
            onDoubleClick={handleResetWidth}
            title="تغییر عرض پنل - دابل‌کلیک برای بازنشانی"
            aria-label="تغییر عرض پنل"
          >
            <span />
          </div>

          <div className={styles.sidebarInner}>
            <header className={styles.header} onPointerDown={handleDragStart}>
              <div className={styles.headerMain}>
                <div className={styles.headerIcon} aria-hidden="true">
                  <TreeIcon />
                </div>

                <div className={styles.headerText}>
                  <span className={styles.eyebrow}>Nexus Structure</span>
                  <span className={styles.title}>ساختار سیستم</span>
                  <span className={styles.subtitle}>مرور، انتخاب و پیمایش درخت</span>
                </div>
              </div>

              <div className={styles.headerActions} data-no-drag="true">
                <button
                  type="button"
                  className={styles.headerButton}
                  onClick={handleMinimize}
                  title="کوچک‌سازی"
                  aria-label="کوچک‌سازی پنل ساختار"
                >
                  <MinusIcon />
                </button>
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

                <div className={styles.selectorWrap} data-no-drag="true">
                  <RootSystemSelector />
                </div>
              </section>

              <section className={`${styles.section} ${styles.hierarchySection}`}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionMeta}>
                    <span className={styles.sectionBadge}>02</span>
                    <span className={styles.sectionLabel}>سلسله‌مراتب</span>
                  </div>

                  <span className={styles.sectionHint}>Resizable</span>
                </div>

                <div className={styles.hierarchyWrap} data-no-drag="true">
                  <HierarchyDropdown />
                </div>
              </section>
            </div>

            <div
              className={styles.heightResizeHandle}
              data-resize-handle="true"
              onPointerDown={handleHeightResizeStart}
              onDoubleClick={handleMaximizeHeight}
              title="تغییر ارتفاع پنل - دابل‌کلیک برای بیشینه‌سازی"
              aria-label="تغییر ارتفاع پنل"
            >
              <span />
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          className={styles.structureFab}
          onClick={handleExpand}
          title="باز کردن ساختار سیستم"
          aria-label="باز کردن ساختار سیستم"
        >
          <span className={styles.structureFabGlow} />
          <span className={styles.structureFabRing} />
          <span className={styles.structureFabIcon}>
            <TreeIcon />
          </span>
          <span className={styles.structureFabDot} />
        </button>
      )}
    </aside>
  );
}

function TreeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4.5V9.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7 13.25V11.8C7 10.4 8.15 9.25 9.55 9.25H14.45C15.85 9.25 17 10.4 17 11.8V13.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="8.75"
        y="2.75"
        width="6.5"
        height="3.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="3.75"
        y="13.25"
        width="6.5"
        height="5.75"
        rx="1.35"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="13.75"
        y="13.25"
        width="6.5"
        height="5.75"
        rx="1.35"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 12H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
