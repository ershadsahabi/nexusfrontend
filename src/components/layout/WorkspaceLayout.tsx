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

import { useCanvasStore } from '@/store/useCanvasStore';

import styles from './WorkspaceLayout.module.css';

interface WorkspaceLayoutProps {
  children: ReactNode;
  projectUuid?: string;
  scenarioId?: string;
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

export const WorkspaceLayout = ({
  children,
  projectUuid,
  scenarioId,
}: WorkspaceLayoutProps) => {
  const selectedEntity = useCanvasStore((state) => state.selectedEntity);

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as InspectorState;

        if (typeof parsed.width === 'number') {
          setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width)));
        }

        if (typeof parsed.collapsed === 'boolean') {
          setCollapsed(parsed.collapsed);
        }
      } else {
        setCollapsed(true);
      }
    } catch (e) {
      console.warn('Failed to load workspace state:', e);
    } finally {
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!selectedEntity) return;

    setCollapsed(false);
  }, [selectedEntity, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    try {
      const payload: InspectorState = { width, collapsed };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_e) {
      // ignore
    }
  }, [width, collapsed, isMounted]);

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

  const handleToggle = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className={styles.workspaceContainer} dir="rtl">
      <Header projectUuid={projectUuid} scenarioId={scenarioId} />

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
          {!collapsed && (
            <div
              className={styles.resizeHandle}
              onPointerDown={handleResizeStart}
            />
          )}

          <button
            type="button"
            className={styles.toggleBtn}
            onClick={handleToggle}
            aria-label={collapsed ? 'Open Properties' : 'Close Properties'}
          >
            <span className={styles.toggleIcon}>{collapsed ? '›' : '‹'}</span>
          </button>

          <div className={styles.panelContentWrapper}>
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
