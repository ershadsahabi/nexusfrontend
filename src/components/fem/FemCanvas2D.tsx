// src/components/fem/FemCanvas2D.tsx

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Minus, Plus, Crosshair, RotateCcw } from 'lucide-react';

import FemSectionPreview from '@/features/fem/section/FemSectionPreview';
import { useFemSectionEditor } from './context/FemSectionEditorContext';

import styles from './FemCanvas2D.module.css';

type Point = { x: number; y: number };

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 50;
const ZOOM_SENSITIVITY = 0.0015;

export default function FemCanvas2D() {
  const {
    draft,
    issues,
    isLoading,
    isError,
    canvasState,
    setCanvasPosition,
    setSelected,
  } = useFemSectionEditor();

  const containerRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingSection, setIsDraggingSection] = useState(false);

  const panRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  });

  const updateMouseWorldPosition = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const worldX = (clientX - rect.left - rect.width / 2 - offset.x) / zoom;
      const worldY = -(clientY - rect.top - rect.height / 2 - offset.y) / zoom;

      setMousePos({ x: worldX, y: worldY });
    },
    [offset, zoom]
  );

  const zoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev * 1.25));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev * 0.8));
  };

  const focusOrigin = () => {
    setOffset({ x: 0, y: 0 });
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      setSelected(false);
    }

    if (event.button === 1 || event.button === 2) {
      event.preventDefault();

      panRef.current = {
        active: true,
        lastX: event.clientX,
        lastY: event.clientY,
      };

      setIsPanning(true);
    }
  };

  const handleSectionPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setSelected(true);
    setIsDraggingSection(true);

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: canvasState.x,
      startY: canvasState.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      updateMouseWorldPosition(event.clientX, event.clientY);

      if (dragRef.current.active) {
        const dx = (event.clientX - dragRef.current.startClientX) / zoom;
        const dy = (event.clientY - dragRef.current.startClientY) / zoom;

        setCanvasPosition(
          dragRef.current.startX + dx,
          dragRef.current.startY - dy
        );
        return;
      }

      if (!panRef.current.active) return;

      const dx = event.clientX - panRef.current.lastX;
      const dy = event.clientY - panRef.current.lastY;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      panRef.current.lastX = event.clientX;
      panRef.current.lastY = event.clientY;
    },
    [setCanvasPosition, updateMouseWorldPosition, zoom]
  );

  const stopPanning = useCallback(() => {
    panRef.current.active = false;
    setIsPanning(false);
  }, []);

  const stopDraggingSection = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
    setIsDraggingSection(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = container.getBoundingClientRect();
      const zoomFactor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY);
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoom * zoomFactor)
      );

      const mouseX = event.clientX - rect.left - rect.width / 2;
      const mouseY = event.clientY - rect.top - rect.height / 2;

      const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);

      setZoom(newZoom);
      setOffset({
        x: newOffsetX,
        y: newOffsetY,
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, offset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    container.addEventListener('contextmenu', preventDefault);

    return () => {
      container.removeEventListener('contextmenu', preventDefault);
    };
  }, []);

  const previewIssues = [
    ...issues,
    ...(isError
      ? [
          {
            level: 'error' as const,
            message: 'دریافت اطلاعات مقطع FEM با خطا مواجه شد.',
          },
        ]
      : []),
    ...(isLoading
      ? [
          {
            level: 'info' as const,
            message: 'در حال دریافت اطلاعات مقطع...',
          },
        ]
      : []),
  ];

  return (
    <div className={styles.canvasShell}>
      <div className={styles.hudTop}>
        <div className={styles.hudBadge}>FEM 2D</div>

        <div className={styles.hudStats}>
          <span className={styles.statItem}>
            <small>X</small> {mousePos.x.toFixed(2)}
          </span>
          <span className={styles.statItem}>
            <small>Y</small> {mousePos.y.toFixed(2)}
          </span>
          <div className={styles.divider} />
          <span className={styles.statItem}>
            <small>Z</small> {(zoom * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className={styles.canvasToolbar}>
        <button className={styles.toolButton} onClick={zoomIn} type="button">
          <Plus size={16} />
        </button>
        <button className={styles.toolButton} onClick={zoomOut} type="button">
          <Minus size={16} />
        </button>
        <div className={styles.toolDivider} />
        <button className={styles.toolButton} onClick={focusOrigin} type="button">
          <Crosshair size={16} />
        </button>
        <button className={styles.toolButton} onClick={resetZoom} type="button">
          <RotateCcw size={16} />
        </button>
        <div className={styles.zoomPercent}>{(zoom * 100).toFixed(0)}%</div>
      </div>

      <div
        ref={containerRef}
        className={`${styles.viewport} ${isPanning ? styles.grabbing : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          stopPanning();
          stopDraggingSection();
        }}
        onMouseLeave={() => {
          stopPanning();
          stopDraggingSection();
        }}
      >
        <div
          className={`${styles.transformationLayer} ${
            isPanning || isDraggingSection ? styles.noTransition : ''
          }`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <div className={styles.gridLayer}>
            <div className={styles.majorGrid} />
            <div className={styles.minorGrid} />
          </div>

          <div className={styles.axes}>
            <div className={styles.axisX} />
            <div className={styles.axisY} />
            <div className={styles.originDot} />
          </div>

          <div
            className={styles.sectionLayer}
            style={{
              transform: `translate(${canvasState.x}px, ${-canvasState.y}px)`,
            }}
          >
            <FemSectionPreview
              section={draft}
              issues={previewIssues}
              selected={canvasState.selected}
              onPointerDown={handleSectionPointerDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
