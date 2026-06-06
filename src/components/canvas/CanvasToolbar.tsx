// src/components/canvas/CanvasToolbar.tsx

'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/common/Button/Button';
import { useCanvasStore } from '@/store/useCanvasStore';

import AddEntityModal from './AddEntityModal';

import styles from './canvasToolbar.module.css';

type Props = {
  projectUuid: string;
  scenarioId?: string;
};

export default function CanvasToolbar({ projectUuid, scenarioId }: Props) {
  const [openModal, setOpenModal] = useState(false);

  const mode = useCanvasStore((s) => s.mode);
  const setMode = useCanvasStore((s) => s.setMode);
  const edgeCreationSourceUuid = useCanvasStore((s) => s.edgeCreationSourceUuid);
  const cancelEdgeCreation = useCanvasStore((s) => s.cancelEdgeCreation);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const selectedEntityUuid = useCanvasStore((s) => s.selectedEntity);
  const entities = useCanvasStore((s) => s.entities);
  const openWorkspaceModal = useCanvasStore((s) => s.openWorkspaceModal);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityUuid) return null;
    return entities.find((entity) => entity.uuid === selectedEntityUuid) ?? null;
  }, [entities, selectedEntityUuid]);

  const workspaceButtonDisabled = !selectedEntity;
  const workspaceButtonLabel = 'مدیریت Workspace';

  const handleWorkspaceAction = () => {
    if (!selectedEntity) return;
    openWorkspaceModal(selectedEntity.uuid, null);
  };

  const handleToggleEdgeMode = () => {
    clearSelection();

    if (mode === 'create-edge') {
      cancelEdgeCreation();
      setMode('select');
      return;
    }

    setMode('create-edge');
  };

  const handleSelectMode = () => {
    cancelEdgeCreation();
    clearSelection();
    setMode('select');
  };

  const getHintText = () => {
    if (mode === 'create-edge') {
      return edgeCreationSourceUuid
        ? 'مبدأ انتخاب شد؛ حالا مقصد را کلیک کنید.'
        : 'ابتدا روی موجودیت مبدأ کلیک کنید.';
    }

    if (!selectedEntity) {
      return 'برای مدیریت Workspace ابتدا یک موجودیت را انتخاب کنید.';
    }

    return 'برای انتخاب، ایجاد یا ورود به Workspaceهای FEM و CAD از این بخش استفاده کنید.';
  };

  return (
    <>
      <div className={styles.toolbarContainer} dir="rtl">
        <Button
          size="sm"
          variant="secondary"
          className={styles.toolbarButton}
          onClick={() => setOpenModal(true)}
        >
          + افزودن سیستم جدید
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className={styles.toolbarButton}
          onClick={handleWorkspaceAction}
          disabled={workspaceButtonDisabled}
        >
          {workspaceButtonLabel}
        </Button>

        <Button
          size="sm"
          variant={mode === 'create-edge' ? 'primary' : 'secondary'}
          className={styles.toolbarButton}
          onClick={handleToggleEdgeMode}
        >
          {mode === 'create-edge' ? 'لغو ایجاد اتصال' : 'ایجاد اتصال'}
        </Button>

        <Button
          size="sm"
          variant={mode === 'select' ? 'primary' : 'secondary'}
          className={styles.toolbarButton}
          onClick={handleSelectMode}
        >
          انتخاب / جابجایی
        </Button>

        <div
          className={[
            styles.hint,
            mode === 'create-edge' ? styles.hintActive : '',
          ].join(' ')}
        >
          {getHintText()}
        </div>
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
