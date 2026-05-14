// src/components/canvas/CameraDock.tsx
"use client";

import React, { useMemo, useState } from "react";
import styles from "./CameraDock.module.css";

export type CameraPreset =
  | "iso"
  | "front"
  | "back"
  | "left"
  | "right"
  | "top";

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

const presetItems: Array<{
  key: CameraPreset;
  label: string;
  title: string;
}> = [
  { key: "iso", label: "ISO", title: "نمای ایزومتریک" },
  { key: "front", label: "F", title: "نمای روبرو" },
  { key: "back", label: "B", title: "نمای پشت" },
  { key: "left", label: "L", title: "نمای چپ" },
  { key: "right", label: "R", title: "نمای راست" },
  { key: "top", label: "T", title: "نمای بالا" },
];

function formatCoord(value: number) {
  if (Object.is(value, -0)) return "0.00";
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
  const [open, setOpen] = useState(false);

  const orbitLabel = useMemo(() => {
    return orbitEnabled ? "چرخش روشن" : "چرخش خاموش";
  }, [orbitEnabled]);

  const [x, y, z] = coordinates;

  return (
    <div className={`${styles.root} ${className ?? ""}`} dir="rtl">
      <button
        type="button"
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "بستن پنل دوربین" : "باز کردن پنل دوربین"}
        aria-expanded={open}
        aria-controls="camera-dock-panel"
        title={open ? "بستن پنل دوربین" : "کنترل دوربین"}
      >
        <span className={styles.fabIcon}>📷</span>
      </button>

      <section
        id="camera-dock-panel"
        className={`${styles.panel} ${
          open ? styles.panelOpen : styles.panelClosed
        }`}
        aria-label="کنترل دوربین"
      >
        <div className={styles.panelHeader}>
          <div className={styles.headerBlock}>
            <div className={styles.headerTitle}>کنترل دوربین</div>
            <div className={styles.headerSubtitle}>Camera / View / Cursor</div>
          </div>

          <button
            type="button"
            className={`${styles.statusChip} ${
              orbitEnabled ? styles.statusOn : styles.statusOff
            }`}
            onClick={onToggleOrbit}
            aria-pressed={orbitEnabled}
            title={orbitLabel}
          >
            <span className={styles.statusDot} />
            {orbitLabel}
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>عملیات سریع</div>

          <div className={styles.mainActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onZoomIn}
              title="زوم این"
              aria-label="زوم این"
            >
              +
            </button>

            <button
              type="button"
              className={styles.iconButton}
              onClick={onZoomOut}
              title="زوم اوت"
              aria-label="زوم اوت"
            >
              −
            </button>

            <button
              type="button"
              className={styles.iconButton}
              onClick={onReset}
              title="بازنشانی دوربین"
              aria-label="بازنشانی دوربین"
            >
              ⟳
            </button>

            <button
              type="button"
              className={`${styles.iconButton} ${
                orbitEnabled ? styles.iconButtonActive : ""
              }`}
              onClick={onToggleOrbit}
              title={orbitLabel}
              aria-label={orbitLabel}
              aria-pressed={orbitEnabled}
            >
              🌀
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>مختصات نشانگر</div>

          <div className={styles.coordsCard}>
            <div className={styles.coordItem}>
              <div className={styles.coordKey}>X</div>
              <div className={styles.coordValue}>{formatCoord(x)}</div>
            </div>

            <div className={styles.coordItem}>
              <div className={styles.coordKey}>Y</div>
              <div className={styles.coordValue}>{formatCoord(y)}</div>
            </div>

            <div className={styles.coordItem}>
              <div className={styles.coordKey}>Z</div>
              <div className={styles.coordValue}>{formatCoord(z)}</div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>نمای سریع</div>

          <div className={styles.presetsGrid}>
            {presetItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={styles.presetButton}
                onClick={() => onPreset(item.key)}
                title={item.title}
                aria-label={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.hint}>
          {orbitEnabled
            ? "چرخش دوربین فعال است. با کلیک و درگ می‌توانید دید را بچرخانید."
            : "چرخش دوربین غیرفعال است تا تعامل با نودها و اتصالات دقیق‌تر و کم‌مزاحمت‌تر باشد."}
        </div>
      </section>
    </div>
  );
}
