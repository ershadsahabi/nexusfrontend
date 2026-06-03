// src/components/canvas/FemLinkModal.tsx

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { useFemStatus, useCreateFemModel } from '@/hooks/useFemModel';
import {
  buildSystemEntityErrorSummary,
  parseSystemErrors,
} from '@/lib/api/system';

import styles from './FemLinkModal.module.css';

type Props = {
  projectUuid: string;
};

function buildFemWorkspaceHref(projectUuid: string, femModelUuid: string) {
  /**
   * اگر route واقعی FEM Workspace در پروژه متفاوت است،
   * فقط همین مسیر را اصلاح کن.
   */
  return `/projects/${projectUuid}/fem/${femModelUuid}`;
}

export default function FemLinkModal({ projectUuid }: Props) {
  const router = useRouter();

  const femModalEntityUuid = useCanvasStore((s) => s.femModalEntityUuid);
  const closeFemModal = useCanvasStore((s) => s.closeFemModal);
  const entities = useCanvasStore((s) => s.entities);

  const selectedEntity = useMemo(() => {
    if (!femModalEntityUuid) return null;
    return entities.find((item) => item.uuid === femModalEntityUuid) ?? null;
  }, [entities, femModalEntityUuid]);

  const {
    data: femStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useFemStatus(projectUuid, femModalEntityUuid);

  const createMutation = useCreateFemModel(projectUuid);

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
        metadata: {},
      });

      /**
       * این refetch باعث می‌شود:
       * 1. useFemStatus داده جدید را بگیرد.
       * 2. useEffect داخل useFemStatus آن را در FemStatusStore ثبت کند.
       * 3. Badge همان node بدون refresh دستی آپدیت شود.
       */
      await refetch();
    } catch {
      // خطا توسط createMutation.error مدیریت می‌شود
    }
  };

  const handleOpenWorkspace = () => {
    if (!femStatus?.femModelUuid) return;

    closeFemModal();
    router.push(buildFemWorkspaceHref(projectUuid, femStatus.femModelUuid));
  };

  const canCreate =
    Boolean(femStatus?.femEligible) &&
    !femStatus?.hasFemModel &&
    !createMutation.isPending &&
    !isLoading &&
    !isError;

  const canOpenWorkspace = Boolean(
    femStatus?.hasFemModel && femStatus?.femModelUuid
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="اتصال مدل FEM به موجودیت سیستمی"
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
            <div className={styles.eyebrow}>ENGINEERING LINK</div>
            <h3 className={styles.heroTitle}>
              ایجاد پل داده‌ای بین لایه سیستمی و مهندسی
            </h3>
            <p className={styles.heroSubtitle}>
              وضعیت قابلیت اتصال FEM بررسی می‌شود و در صورت مجاز بودن، مدل
              مهندسی برای موجودیت انتخاب‌شده ساخته خواهد شد.
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
                  در حال بررسی وضعیت FEM...
                </div>
                <p className={styles.stateText}>
                  سیستم در حال بررسی مجاز بودن موجودیت برای ساخت مدل مهندسی
                  است.
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
                    خطایی هنگام دریافت وضعیت FEM رخ داد.
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
          ) : femStatus ? (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <div className={styles.cardTitle}>
                  <ShieldCheck size={16} />
                  <span>وضعیت اتصال مهندسی</span>
                </div>

                {femStatus.hasFemModel ? (
                  <span className={styles.statusPillSuccess}>متصل</span>
                ) : femStatus.femEligible ? (
                  <span className={styles.statusPillWarning}>
                    آماده اتصال
                  </span>
                ) : (
                  <span className={styles.statusPillWarning}>غیرمجاز</span>
                )}
              </div>

              <div className={styles.statusRows}>
                <div className={styles.statusRow}>
                  <span className={styles.label}>FEM Eligibility</span>

                  <span
                    className={
                      femStatus.femEligible
                        ? styles.badgeSuccess
                        : styles.badgeMuted
                    }
                  >
                    {femStatus.femEligible ? 'مجاز' : 'غیرمجاز'}
                  </span>
                </div>

                <div className={styles.statusRow}>
                  <span className={styles.label}>وضعیت مدل</span>

                  <span
                    className={
                      femStatus.hasFemModel
                        ? styles.badgeSuccess
                        : styles.badgeWarning
                    }
                  >
                    {femStatus.hasFemModel ? 'ایجاد شده' : 'موجود نیست'}
                  </span>
                </div>

                {femStatus.femModelUuid ? (
                  <div className={styles.statusRow}>
                    <span className={styles.label}>FEM Model UUID</span>
                    <span className={styles.valueMono}>
                      {femStatus.femModelUuid}
                    </span>
                  </div>
                ) : null}
              </div>

              {!femStatus.femEligible ? (
                <div className={styles.infoBoxMuted}>
                  <Info size={16} />
                  <span>این موجودیت مجاز به داشتن مدل مهندسی نیست.</span>
                </div>
              ) : femStatus.hasFemModel ? (
                <div className={styles.infoBoxMuted}>
                  <Info size={16} />
                  <span>
                    مدل FEM برای این موجودیت از قبل ایجاد شده است. می‌توانید
                    وارد فضای کاری مهندسی شوید.
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
                <div className={styles.stateTitle}>خطا در ایجاد مدل</div>

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
            {femStatus?.hasFemModel
              ? 'اتصال FEM برای این موجودیت برقرار است.'
              : 'در صورت مجاز بودن، مدل FEM برای این موجودیت ایجاد می‌شود.'}
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
                  'ایجاد مدل FEM'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
