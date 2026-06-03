// src/components/canvas/CanvasToolbar.tsx

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Button from '@/components/common/Button/Button';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFemStatusStore } from '@/store/useFemStatusStore';

import AddEntityModal from './AddEntityModal';

import styles from './canvasToolbar.module.css';

type Props = {
  projectUuid: string;
  scenarioId?: string;
};

function buildFemWorkspaceHref(projectUuid: string, femModelUuid: string) {
  /**
   * اگر route واقعی FEM Workspace در پروژه متفاوت است،
   * فقط همین مسیر را اصلاح کن.
   */
  return `/projects/${projectUuid}/fem/${femModelUuid}`;
}

export default function CanvasToolbar({ projectUuid, scenarioId }: Props) {
  const router = useRouter();

  const [openModal, setOpenModal] = useState(false);

  const mode = useCanvasStore((s) => s.mode);
  const setMode = useCanvasStore((s) => s.setMode);
  const edgeCreationSourceUuid = useCanvasStore((s) => s.edgeCreationSourceUuid);
  const cancelEdgeCreation = useCanvasStore((s) => s.cancelEdgeCreation);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const selectedEntityUuid = useCanvasStore((s) => s.selectedEntity);
  const entities = useCanvasStore((s) => s.entities);
  const openFemModal = useCanvasStore((s) => s.openFemModal);

  const selectedFemStatus = useFemStatusStore((s) =>
    selectedEntityUuid ? s.byEntityUuid[selectedEntityUuid] ?? null : null
  );

  const selectedEntity = useMemo(() => {
    if (!selectedEntityUuid) return null;
    return entities.find((entity) => entity.uuid === selectedEntityUuid) ?? null;
  }, [entities, selectedEntityUuid]);

  const selectedEntityFemEligibleFromCatalog =
    selectedEntity?.systemType?.fem_eligible ?? false;

  /**
   * اگر status از bulk-status آمده باشد، مبنای دقیق همان است.
   * اگر هنوز status نداریم، fallback سبک از systemType استفاده می‌شود.
   */
  const isSelectedFemEligible =
    selectedFemStatus?.femEligible ?? selectedEntityFemEligibleFromCatalog;

  const selectedHasFemModel = Boolean(selectedFemStatus?.hasFemModel);
  const selectedFemModelUuid = selectedFemStatus?.femModelUuid ?? null;

  const femButtonDisabled =
    !selectedEntity ||
    /**
     * اگر status موجود است و صراحتاً غیرمجاز است، دکمه غیرفعال شود.
     * اگر status هنوز نیامده ولی catalog هم می‌گوید fem_eligible نیست،
     * باز هم غیرفعال می‌کنیم.
     */
    !isSelectedFemEligible;

  const femButtonLabel = !selectedEntity
    ? 'اتصال FEM'
    : selectedHasFemModel
      ? 'ورود به FEM'
      : 'اتصال FEM';

  const handleFemAction = () => {
    if (!selectedEntity) return;

    /**
     * اگر status موجود است و مدل FEM دارد، مستقیم وارد Workspace شو.
     */
    if (selectedHasFemModel && selectedFemModelUuid) {
      router.push(buildFemWorkspaceHref(projectUuid, selectedFemModelUuid));
      return;
    }

    /**
     * در غیر این صورت Modal باز می‌شود.
     * Modal خودش status دقیق را fetch/refetch می‌کند.
     */
    openFemModal(selectedEntity.uuid);
  };

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

  const getHintText = () => {
    if (mode === 'create-edge') {
      return edgeCreationSourceUuid
        ? 'مبدأ انتخاب شد؛ حالا مقصد را کلیک کنید.'
        : 'ابتدا روی موجودیت مبدأ کلیک کنید.';
    }

    if (selectedEntity && !isSelectedFemEligible) {
      return 'موجودیت انتخاب‌شده قابلیت اتصال FEM ندارد.';
    }

    if (selectedEntity && selectedHasFemModel) {
      return 'برای موجودیت انتخاب‌شده مدل FEM موجود است.';
    }

    return 'حالت انتخابگر فعال است.';
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
          variant={selectedHasFemModel ? 'primary' : 'secondary'}
          className={styles.toolbarButton}
          onClick={handleFemAction}
          disabled={femButtonDisabled}
        >
          {femButtonLabel}
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
