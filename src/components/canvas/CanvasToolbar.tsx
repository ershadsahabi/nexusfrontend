// src/components/canvas/CanvasToolbar.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import { useCanvasStore } from '@/store/useCanvasStore';
import AddEntityModal from './AddEntityModal';

import styles from './canvasToolbar.module.css';

type Props = {
  projectUuid: string;
  scenarioId?: string;
};

export default function CanvasToolbar({ projectUuid, scenarioId }: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const mode = useCanvasStore((s) => s.mode);
  const setMode = useCanvasStore((s) => s.setMode);
  const edgeCreationSourceUuid = useCanvasStore((s) => s.edgeCreationSourceUuid);
  const cancelEdgeCreation = useCanvasStore((s) => s.cancelEdgeCreation);
  const clearSelection = useCanvasStore((s) => s.clearSelection);

  const handleToggleEdgeMode = () => {
    clearSelection();
    if (mode === 'create-edge') {
      cancelEdgeCreation();
      setMode('select');
    } else {
      setMode('create-edge');
    }
  };

  const handleSelectMode = () => {
    cancelEdgeCreation();
    clearSelection();
    setMode('select');
  };

  // تولید متن راهنما بر اساس وضعیت
  const getHintText = () => {
    if (mode === 'create-edge') {
      return edgeCreationSourceUuid
        ? 'مبدأ انتخاب شد؛ حالا مقصد را کلیک کنید.'
        : 'ابتدا روی موجودیت مبدأ کلیک کنید.';
    }
    return 'حالت انتخابگر فعال است.';
  };

  return (
    <>
      <div className={styles.toolbarContainer} dir="rtl">
        <Button
          variant={openMenu ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setOpenMenu(!openMenu)}
          className={styles.toolbarToggle}
        >
          {openMenu ? '✕ بستن ابزارها' : '🎛 ابزارها'}
        </Button>

        {openMenu && (
          <Card className={styles.toolbarMenu}>
            <Button size="sm" variant="secondary" onClick={() => setOpenModal(true)}>
              + افزودن سیستم جدید
            </Button>

            <Button
              size="sm"
              variant={mode === 'create-edge' ? 'primary' : 'secondary'}
              onClick={handleToggleEdgeMode}
            >
              {mode === 'create-edge' ? 'لغو ایجاد اتصال' : 'ایجاد اتصال'}
            </Button>

            <Button
              size="sm"
              variant={mode === 'select' ? 'primary' : 'secondary'}
              onClick={handleSelectMode}
            >
              انتخاب / جابجایی
            </Button>

            <div className={styles.hint}>{getHintText()}</div>
          </Card>
        )}
      </div>

      {/* مودال افزودن موجودیت (بدون تغییر) */}
      <AddEntityModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        projectUuid={projectUuid}
        scenarioId={scenarioId}
      />
    </>
  );
}
