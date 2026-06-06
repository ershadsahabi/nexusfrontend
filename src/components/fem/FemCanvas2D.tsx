// src/components/fem/FemCanvas2D.tsx

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Minus, Plus, Crosshair, RotateCcw } from 'lucide-react';
import styles from './FemCanvas2D.module.css';

type Point = { x: number; y: number };

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 50;
const ZOOM_SENSITIVITY = 0.0015;

export default function FemCanvas2D() {
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs for smooth panning performance
  const panRef = useRef({ active: false, lastX: 0, lastY: 0 });

  // --- Logic: coordinate conversion ---
  const updateMouseWorldPosition = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // تبدیل مختصات پیکسل به مختصات جهانی (World Space)
    const worldX = (clientX - rect.left - rect.width / 2 - offset.x) / zoom;
    const worldY = -(clientY - rect.top - rect.height / 2 - offset.y) / zoom;
    setMousePos({ x: worldX, y: worldY });
  }, [offset, zoom]);

  // --- Actions ---
  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev * 1.25));
  const zoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev * 0.8));

  // تفکیک دکمه‌ها طبق درخواست شما:
  const focusOrigin = () => setOffset({ x: 0, y: 0 }); // فقط جابجایی به مرکز
  const resetZoom = () => setZoom(1);              // فقط بازگشت به مقیاس ۱۰۰٪

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) { // Middle or Right click
      e.preventDefault();
      panRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      setIsPanning(true);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateMouseWorldPosition(e.clientX, e.clientY);

    if (!panRef.current.active) return;

    const dx = e.clientX - panRef.current.lastX;
    const dy = e.clientY - panRef.current.lastY;

    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    panRef.current.lastX = e.clientX;
    panRef.current.lastY = e.clientY;
  }, [updateMouseWorldPosition]);

  const stopPanning = useCallback(() => {
    panRef.current.active = false;
    setIsPanning(false);
  }, []);

  // --- Wheel Zoom (Engineering Style: Zoom at Mouse Point) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = container.getBoundingClientRect();
      const zoomFactor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));

      // محاسبه آفست جدید برای اینکه نقطه زیر ماوس ثابت بماند
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);

      setZoom(newZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, offset]);

  // --- Browser Event Preventers ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventDefault = (e: Event) => e.preventDefault();
    container.addEventListener('contextmenu', preventDefault);
    return () => container.removeEventListener('contextmenu', preventDefault);
  }, []);

  return (
    <div className={styles.canvasShell}>
      {/* HUD Info */}
      <div className={styles.hudTop}>
        <div className={styles.hudBadge}>FEM 2D ENGINE</div>
        <div className={styles.hudStats}>
          <span className={styles.statItem}><small>X</small> {mousePos.x.toFixed(2)}</span>
          <span className={styles.statItem}><small>Y</small> {mousePos.y.toFixed(2)}</span>
          <div className={styles.divider} />
          <span className={styles.statItem}><small>Z</small> {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Professional Toolbar */}
      <div className={styles.canvasToolbar}>
        <button className={styles.toolButton} onClick={zoomIn} title="Zoom In"><Plus size={16} /></button>
        <button className={styles.toolButton} onClick={zoomOut} title="Zoom Out"><Minus size={16} /></button>
        
        <div className={styles.toolDivider} />

        <button className={styles.toolButton} onClick={focusOrigin} title="Focus Origin (Center)">
          <Crosshair size={16} />
        </button>
        <button className={styles.toolButton} onClick={resetZoom} title="Reset Zoom (100%)">
          <RotateCcw size={16} />
        </button>

        <div className={styles.zoomPercent}>{(zoom * 100).toFixed(0)}%</div>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className={`${styles.viewport} ${isPanning ? styles.grabbing : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
      >
        <div 
          className={`${styles.transformationLayer} ${isPanning ? styles.noTransition : ''}`}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        >
          {/* Engineering Grids */}
          <div className={styles.gridLayer}>
            <div className={styles.majorGrid} />
            <div className={styles.minorGrid} />
          </div>

          {/* Core Axes */}
          <div className={styles.axes}>
            <div className={styles.axisX} />
            <div className={styles.axisY} />
            <div className={styles.originDot} />
          </div>

          {/* Reference Node */}
          <div className={styles.placeholderElement} style={{ left: 150, top: -150 }}>
            <div className={styles.nodeHandle} />
            <span className={styles.nodeLabel}>REF_NODE_01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
