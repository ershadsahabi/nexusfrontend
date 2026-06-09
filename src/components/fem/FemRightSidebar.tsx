// src/components/fem/FemRightSidebar.tsx

'use client';

import { useMemo } from 'react';
import { useFemSectionEditor } from './context/FemSectionEditorContext';
import styles from './FemRightSidebar.module.css';

function toInputValue(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return String(value);
}

export default function FemRightSidebar() {
  const {
    draft,
    patchDimensions,
    patchDraft,
    resetDraft,
    saveOutput,
    isSaving,
    saveError,
    savedRevision,
  } = useFemSectionEditor();

  const visibleFields = useMemo(() => {
    if (!draft) return [];

    if (draft.kind === 'circular' || draft.kind === 'cylinder') {
      return [
        { key: 'diameter', label: 'Diameter' },
      ] as const;
    }

    if (draft.kind === 'box_culvert') {
      return [
        { key: 'width', label: 'Width' },
        { key: 'height', label: 'Height' },
        { key: 'thickness', label: 'Thickness' },
      ] as const;
    }

    if (draft.kind === 'i_shape') {
      return [
        { key: 'width', label: 'Width' },
        { key: 'height', label: 'Height' },
        { key: 'flangeWidth', label: 'Flange Width' },
        { key: 'flangeThickness', label: 'Flange Thickness' },
        { key: 'webThickness', label: 'Web Thickness' },
      ] as const;
    }

    return [
      { key: 'width', label: 'Width' },
      { key: 'height', label: 'Height' },
    ] as const;
  }, [draft]);

  if (!draft) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.empty}>داده‌ای برای ویرایش وجود ندارد.</div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <section className={styles.card}>
        <div className={styles.cardTitle}>ویرایش مقطع</div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Label</span>
            <input
              className={styles.input}
              value={draft.label}
              onChange={(event) =>
                patchDraft({ label: event.target.value })
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Units</span>
            <input
              className={styles.input}
              value={draft.units}
              onChange={(event) =>
                patchDraft({ units: event.target.value })
              }
            />
          </label>

          {visibleFields.map((field) => (
            <label key={field.key} className={styles.field}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <input
                type="number"
                step="any"
                min="0"
                className={styles.input}
                value={toInputValue(draft.dimensions[field.key])}
                onChange={(event) => {
                  const raw = event.target.value;
                  patchDimensions({
                    [field.key]: raw === '' ? null : Number(raw),
                  });
                }}
              />
            </label>
          ))}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Material Grade</span>
            <input
              className={styles.input}
              value={draft.material.grade ?? ''}
              onChange={(event) =>
                patchDraft({
                  material: {
                    grade: event.target.value,
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetDraft}
            disabled={isSaving}
          >
            بازنشانی
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={saveOutput}
            disabled={isSaving}
          >
            {isSaving ? 'در حال ذخیره...' : 'ذخیره خروجی'}
          </button>
        </div>

        {saveError ? (
          <div className={styles.error}>{saveError}</div>
        ) : null}

        {savedRevision ? (
          <div className={styles.success}>
            Revision #{savedRevision} ذخیره شد.
          </div>
        ) : null}
      </section>
    </div>
  );
}
