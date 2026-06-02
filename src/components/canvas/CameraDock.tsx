// src/components/canvas/CameraDock.tsx

'use client';

import React, { useMemo, useState } from 'react';
import {
  Camera,
  ChevronDown,
  Crosshair,
  Orbit,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import FloatingPanel from '@/components/common/FloatingPanel/FloatingPanel';
import floatingStyles from '@/components/common/FloatingPanel/FloatingPanel.module.css';
import styles from './CameraDock.module.css';

export type CameraPreset = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top';

type CameraDockProps = {
  orbitEnabled: boolean;
  coordinates: [number, number, number];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleOrbit: () => void;
  onPreset: (preset: CameraPreset) => void;
  className?: string;
};

const presetItems: Array<{ key: CameraPreset; label: string; title: string }> = [
  { key: 'iso', label: 'ISO', title: 'نمای ایزومتریک' },
  { key: 'top', label: 'Top', title: 'نمای بالا' },
  { key: 'front', label: 'Front', title: 'نمای روبرو' },
  { key: 'back', label: 'Back', title: 'نمای پشت' },
  { key: 'left', label: 'Left', title: 'نمای چپ' },
  { key: 'right', label: 'Right', title: 'نمای راست' },
];

function formatCoord(value: number) {
  if (Object.is(value, -0)) return '0.00';
  return value.toFixed(2);
}

export default function CameraDock({
  orbitEnabled,
  coordinates,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleOrbit,
  onPreset,
  className,
}: CameraDockProps) {
  const [viewsOpen, setViewsOpen] = useState(false);

  const orbitLabel = useMemo(
    () => (orbitEnabled ? 'چرخش روشن' : 'چرخش خاموش'),
    [orbitEnabled]
  );

  const [x, y, z] = coordinates;

  return (
    <div className={`${styles.root} ${className ?? ''}`} dir="rtl">
      <div className={styles.inlineRail}>
        <div className={styles.title}>
          <Camera size={14} />
          <span>دوربین</span>
        </div>

        <div className={styles.coords} title="مختصات دوربین">
          <span className={styles.coordChip}>
            <span className={`${styles.axis} ${styles.axisX}`}>X</span>
            <span className={styles.coordValue}>{formatCoord(x)}</span>
          </span>
          <span className={styles.coordChip}>
            <span className={`${styles.axis} ${styles.axisY}`}>Y</span>
            <span className={styles.coordValue}>{formatCoord(y)}</span>
          </span>
          <span className={`${styles.coordChip}`}>
            <span className={`${styles.axis} ${styles.axisZ}`}>Z</span>
            <span className={styles.coordValue}>{formatCoord(z)}</span>
          </span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onZoomIn}
            title="زوم این"
            aria-label="زوم این"
          >
            <ZoomIn size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onZoomOut}
            title="زوم اوت"
            aria-label="زوم اوت"
          >
            <ZoomOut size={16} />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onReset}
            title="بازنشانی دوربین"
            aria-label="بازنشانی دوربین"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={`${styles.iconButton} ${orbitEnabled ? styles.iconButtonActive : ''}`}
            onClick={onToggleOrbit}
            title={orbitLabel}
            aria-label={orbitLabel}
          >
            <Orbit size={16} />
          </button>

          <FloatingPanel
            open={viewsOpen}
            onOpenChange={setViewsOpen}
            placement="bottom-start"
            offsetValue={10}
            className={`${styles.viewsMenu} ${floatingStyles.panel}`}
            trigger={
              <button
                type="button"
                className={`${styles.secondaryButton} ${viewsOpen ? styles.secondaryButtonOpen : ''}`}
                title="نماهای پیش‌فرض"
              >
                <Crosshair size={14} />
                <span>نماها</span>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${viewsOpen ? styles.chevronOpen : ''}`}
                />
              </button>
            }
          >
            <>
              {presetItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.viewButton} ${item.key === 'iso' ? styles.viewButtonPrimary : ''}`}
                  onClick={() => {
                    onPreset(item.key);
                    setViewsOpen(false);
                  }}
                  title={item.title}
                  role="menuitem"
                >
                  {item.label}
                </button>
              ))}
            </>
          </FloatingPanel>
        </div>
      </div>
    </div>
  );
}
