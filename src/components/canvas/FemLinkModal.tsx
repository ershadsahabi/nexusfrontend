// src/components/canvas/FemLinkModal.tsx


'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  Cpu,
  DatabaseZap,
  ExternalLink,
  Info,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { Modal } from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import { useCanvasStore } from '@/store/useCanvasStore';

import {
  useWorkspaceStatus,
  useCreateWorkspace,
} from '@/hooks/useWorkspaceModel';

import {
  buildSystemEntityErrorSummary,
  parseSystemErrors,
} from '@/lib/api/system';

import { buildWorkspaceHref } from '@/lib/types/workspace.types';

import styles from './FemLinkModal.module.css';

type Props = {
  projectUuid: string;
};

export default function FemLinkModal({ projectUuid }: Props) {
  const femModalEntityUuid = useCanvasStore((s) => s.femModalEntityUuid);
  const closeFemModal = useCanvasStore((s) => s.closeFemModal);
  const entities = useCanvasStore((s) => s.entities);

  const selectedEntity = useMemo(() => {
    if (!femModalEntityUuid) return null;
    return entities.find((item) => item.uuid === femModalEntityUuid) ?? null;
  }, [entities, femModalEntityUuid]);

  const {
    data: workspaceStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceStatus(projectUuid, femModalEntityUuid, 'FEM');

  const createMutation = useCreateWorkspace(projectUuid);

  const createErrorSummary = useMemo(() => {
    if (!createMutation.error) return [];

    return buildSystemEntityErrorSummary(
      parseSystemErrors(createMutation.error)
    );
  }, [createMutation.error]);

  const statusErrorSummary = useMemo(() => {
    if (!isError) return [];

    return buildSystemEntityErrorSummary(parseSystemErrors(error));
  }, [isError, error]);

  const isOpen = Boolean(femModalEntityUuid && selectedEntity);

  if (!femModalEntityUuid || !selectedEntity) return null;

  const handleClose = () => {
    if (createMutation.isPending) return;
    closeFemModal();
  };

  const handleCreate = async () => {
    if (!femModalEntityUuid) return;

    try {
      await createMutation.mutateAsync({
        systemEntityUuid: femModalEntityUuid,
        workspaceType: 'FEM',
        metadata: {},
      });

      await refetch();
    } catch {
      // handled by mutation error state
    }
  };

  const handleOpenWorkspace = () => {
    if (!workspaceStatus?.workspaceUuid) return;

    const href = buildWorkspaceHref(
      projectUuid,
      'FEM',
      workspaceStatus.workspaceUuid
    );

    closeFemModal();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const canCreate =
    Boolean(workspaceStatus?.eligible) &&
    !workspaceStatus?.hasWorkspace &&
    !createMutation.isPending &&
    !isLoading &&
    !isError;

  const canOpenWorkspace = Boolean(
    workspaceStatus?.hasWorkspace && workspaceStatus?.workspaceUuid
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="اتصال Workspace نوع FEM به موجودیت سیستمی"
      size="lg"
      closeOnBackdrop={!createMutation.isPending}
    >
      <div
        className={styles.container}
        dir="rtl"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Cpu size={20} />
          </div>

          <div className={styles.heroText}>
            <div className={styles.eyebrow}>ENGINEERING WORKSPACE</div>
            <h3 className={styles.heroTitle}>
              ایجاد Workspace مهندسی برای موجودیت سیستمی
            </h3>
            <p className={styles.heroSubtitle}>
              وضعیت قابلیت اتصال Workspace نوع FEM بررسی می‌شود و در صورت مجاز
              بودن، Workspace برای موجودیت انتخاب‌شده ساخته خواهد شد.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.entityCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <DatabaseZap size={16} />
                <span>موجودیت انتخاب‌شده</span>
              </div>

              <span className={styles.entityTypePill}>
                {selectedEntity.entityType}
              </span>
            </div>

            <div className={styles.entityGrid}>
              <div className={styles.fieldItem}>
                <span className={styles.label}>نام</span>
                <span className={styles.value}>{selectedEntity.name}</span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>کد</span>
                <span className={styles.valueMono}>{selectedEntity.code}</span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نوع نمایشی</span>
                <span className={styles.value}>
                  {selectedEntity.entityType}
                </span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نوع سیستم</span>
                <span className={styles.value}>
                  {selectedEntity.systemType?.name ?? '—'}
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loadingBox}>
              <div className={styles.messageIconInfo}>
                <Loader2 size={17} className={styles.spinner} />
              </div>

              <div className={styles.messageBody}>
                <div className={styles.stateTitle}>
                  در حال بررسی وضعیت Workspace...
                </div>
                <p className={styles.stateText}>
                  سیستم در حال بررسی مجاز بودن موجودیت برای ساخت Workspace نوع
                  FEM است.
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className={styles.errorBox}>
              <div className={styles.messageIconDanger}>
                <AlertTriangle size={17} />
              </div>

              <div className={styles.messageBody}>
                <div className={styles.stateTitle}>
                  دریافت وضعیت ناموفق بود
                </div>

                {statusErrorSummary.length > 0 ? (
                  <ul className={styles.errorList}>
                    {statusErrorSummary.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.stateText}>
                    خطایی هنگام دریافت وضعیت Workspace رخ داد.
                  </p>
                )}

                <div className={styles.actionsInline}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => refetch()}
                  >
                    تلاش مجدد
                  </Button>
                </div>
              </div>
            </div>
          ) : workspaceStatus ? (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <div className={styles.cardTitle}>
                  <ShieldCheck size={16} />
                  <span>وضعیت Workspace مهندسی</span>
                </div>

                {workspaceStatus.hasWorkspace ? (
                  <span className={styles.statusPillSuccess}>متصل</span>
                ) : workspaceStatus.eligible ? (
                  <span className={styles.statusPillWarning}>آماده اتصال</span>
                ) : (
                  <span className={styles.statusPillWarning}>غیرمجاز</span>
                )}
              </div>

              <div className={styles.statusRows}>
                <div className={styles.statusRow}>
                  <span className={styles.label}>FEM Eligibility</span>

                  <span
                    className={
                      workspaceStatus.eligible
                        ? styles.badgeSuccess
                        : styles.badgeMuted
                    }
                  >
                    {workspaceStatus.eligible ? 'مجاز' : 'غیرمجاز'}
                  </span>
                </div>

                <div className={styles.statusRow}>
                  <span className={styles.label}>وضعیت Workspace</span>

                  <span
                    className={
                      workspaceStatus.hasWorkspace
                        ? styles.badgeSuccess
                        : styles.badgeWarning
                    }
                  >
                    {workspaceStatus.hasWorkspace ? 'ایجاد شده' : 'موجود نیست'}
                  </span>
                </div>

                {workspaceStatus.workspaceUuid ? (
                  <div className={styles.statusRow}>
                    <span className={styles.label}>Workspace UUID</span>
                    <span className={styles.valueMono}>
                      {workspaceStatus.workspaceUuid}
                    </span>
                  </div>
                ) : null}
              </div>

              {!workspaceStatus.eligible ? (
                <div className={styles.infoBoxMuted}>
                  <Info size={16} />
                  <span>این موجودیت مجاز به داشتن Workspace نوع FEM نیست.</span>
                </div>
              ) : workspaceStatus.hasWorkspace ? (
                <div className={styles.infoBoxMuted}>
                  <Info size={16} />
                  <span>
                    Workspace نوع FEM برای این موجودیت از قبل ایجاد شده است.
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {createErrorSummary.length > 0 ? (
            <div className={styles.errorBox}>
              <div className={styles.messageIconDanger}>
                <AlertTriangle size={17} />
              </div>

              <div className={styles.messageBody}>
                <div className={styles.stateTitle}>خطا در ایجاد Workspace</div>

                <ul className={styles.errorList}>
                  {createErrorSummary.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHint}>
            {workspaceStatus?.hasWorkspace
              ? 'Workspace نوع FEM برای این موجودیت برقرار است.'
              : 'در صورت مجاز بودن، Workspace نوع FEM برای این موجودیت ایجاد می‌شود.'}
          </div>

          <div className={styles.footerActions}>
            <Button size="sm" variant="secondary" onClick={handleClose}>
              بستن
            </Button>

            {canOpenWorkspace ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenWorkspace}
              >
                <span className={styles.buttonContent}>
                  <ExternalLink size={14} />
                  ورود به Workspace
                </span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreate}
                disabled={!canCreate}
              >
                {createMutation.isPending ? (
                  <span className={styles.buttonContent}>
                    <Loader2 size={14} className={styles.spinner} />
                    در حال ایجاد...
                  </span>
                ) : (
                  'ایجاد Workspace FEM'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
