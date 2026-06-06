// src/components/canvas/CanvasToolbar.tsx

'use client';

import { useMemo, useState } from 'react';

import Button from '@/components/common/Button/Button';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  getWorkspaceStatusStoreKey,
  useWorkspaceStatusStore,
} from '@/store/useWorkspaceStatusStore';

import AddEntityModal from './AddEntityModal';

import { buildWorkspaceHref } from '@/lib/types/workspace.types';

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
  const openFemModal = useCanvasStore((s) => s.openFemModal);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityUuid) return null;
    return entities.find((entity) => entity.uuid === selectedEntityUuid) ?? null;
  }, [entities, selectedEntityUuid]);

  const selectedFemWorkspaceStatus = useWorkspaceStatusStore((s) => {
    if (!selectedEntityUuid) return null;

    const key = getWorkspaceStatusStoreKey(selectedEntityUuid, 'FEM');
    return s.byKey[key] ?? null;
  });

  const selectedHasFemWorkspace = Boolean(
    selectedFemWorkspaceStatus?.hasWorkspace
  );

  const selectedFemWorkspaceUuid =
    selectedFemWorkspaceStatus?.workspaceUuid ?? null;

  /**
   * نکته مهم:
   * فعلاً eligibility باعث disabled شدن دکمه نمی‌شود.
   * چون مشکل فعلی دقیقاً از همین false/null شدن eligibility می‌آید.
   */
  const femButtonDisabled = !selectedEntity;

  const femButtonLabel =
    selectedEntity && selectedHasFemWorkspace ? 'ورود به FEM' : 'اتصال FEM';

  const handleFemAction = () => {
    if (!selectedEntity) return;

    if (selectedHasFemWorkspace) {
      if (!selectedFemWorkspaceUuid) {
        console.error(
          'CanvasToolbar: hasWorkspace=true but workspaceUuid is missing',
          {
            selectedEntityUuid: selectedEntity.uuid,
            selectedFemWorkspaceStatus,
          }
        );

        return;
      }

      const href = buildWorkspaceHref(
        projectUuid,
        'FEM',
        selectedFemWorkspaceUuid
      );

      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    openFemModal(selectedEntity.uuid);
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
      return 'حالت انتخابگر فعال است.';
    }

    if (selectedHasFemWorkspace) {
      return 'برای موجودیت انتخاب‌شده Workspace نوع FEM موجود است.';
    }

    return 'برای موجودیت انتخاب‌شده می‌توان Workspace نوع FEM ایجاد کرد.';
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
          variant={selectedHasFemWorkspace ? 'primary' : 'secondary'}
          className={styles.toolbarButton}
          onClick={handleFemAction}
          disabled={femButtonDisabled}
        >
          {femButtonLabel}
          {selectedHasFemWorkspace && (
            <span style={{ marginRight: '6px' }}>↗</span>
          )}
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
