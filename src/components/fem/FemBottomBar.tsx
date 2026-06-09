// src/components/fem/FemBottomBar.tsx

'use client';

import { useFemSectionEditor } from './context/FemSectionEditorContext';
import styles from './FemBottomBar.module.css';

export default function FemBottomBar() {
  const { draft, canvasState, isSaving, savedRevision } = useFemSectionEditor();

  return (
    <footer className={styles.bottomBar}>
      <div className={styles.group}>
        <span className={styles.item}>
          انتخاب: {canvasState.selected ? 'مقطع' : 'هیچ'}
        </span>
        <span className={styles.sep} />
        <span className={styles.item}>
          X: {canvasState.x.toFixed(0)}
        </span>
        <span className={styles.sep} />
        <span className={styles.item}>
          Y: {canvasState.y.toFixed(0)}
        </span>
      </div>

      <div className={styles.group}>
        <span className={styles.item}>
          نوع: {draft?.kind ?? '—'}
        </span>
        <span className={styles.sep} />
        <span className={styles.item}>
          ذخیره: {isSaving ? 'در حال انجام...' : savedRevision ? `#${savedRevision}` : '—'}
        </span>
      </div>
    </footer>
  );
}
