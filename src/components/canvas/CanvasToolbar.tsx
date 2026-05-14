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
    if (mode === 'create-edge') {
      cancelEdgeCreation();
      clearSelection();
      setMode('select');
    } else {
      clearSelection();
      setMode('create-edge');
    }
  };

  const handleSelectMode = () => {
    cancelEdgeCreation();
    clearSelection();
    setMode('select');
  };

  const hint =
    mode === 'create-edge'
      ? edgeCreationSourceUuid
        ? 'مبدأ انتخاب شده؛ مقصد را انتخاب کنید.'
        : 'ابتدا موجودیت مبدأ را انتخاب کنید.'
      : 'حالت انتخاب فعال است.';

  return (
    <>
      {/* Toggle Button */}
      <div className={styles.toolbarContainer} dir="rtl">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpenMenu((prev) => !prev)}
          className={styles.toolbarToggle}
        >
          🎛 ابزارها
        </Button>

        {/* Dropdown Menu */}
        {openMenu && (
          <Card className={styles.toolbarMenu}>
            <Button size="sm" onClick={() => setOpenModal(true)}>
              افزودن سیستم جدید
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
              انتخاب
            </Button>

            <div className={styles.hint}>{hint}</div>
          </Card>
        )}
      </div>

      <AddEntityModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        projectUuid={projectUuid}
        scenarioId={scenarioId}
      />
    </>
  );
}
