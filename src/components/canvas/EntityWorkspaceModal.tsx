// src/components/canvas/EntityWorkspaceModal.tsx

'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  DatabaseZap,
  ExternalLink,
  Info,
  Loader2,
  ShieldCheck,
  Boxes,
  CheckCircle2,
  PlusCircle,
  XCircle,
} from 'lucide-react';

import { Modal } from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import { useCanvasStore } from '@/store/useCanvasStore';

import {
  useCreateWorkspace,
  useWorkspaceStatus,
} from '@/hooks/useWorkspaceModel';

import {
  buildSystemEntityErrorSummary,
  parseSystemErrors,
} from '@/lib/api/system';

import type {
  EnhancedCanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

import { buildWorkspaceHref } from '@/lib/types/workspace.types';
import {
  getWorkspaceCreateLabel,
  getWorkspaceDisplayName,
  getWorkspaceEligibilityLabel,
  getWorkspaceTitle,
} from '@/lib/workspace/workspace-ui';

import styles from './EntityWorkspaceModal.module.css';

type Props = {
  projectUuid: string;
};

function buildWorkspaceName(
  entityName: string,
  entityCode: string | null | undefined,
  workspaceDisplayName: string
): string {
  const safeName = String(entityName || '').trim();
  const safeCode = String(entityCode || '').trim();

  if (safeCode) {
    return `${safeName} - ${workspaceDisplayName} Workspace (${safeCode})`;
  }

  return `${safeName} - ${workspaceDisplayName} Workspace`;
}

function getStatusPill(status: EnhancedCanvasWorkspaceStatus | null | undefined) {
  if (!status) {
    return <span className={styles.statusPillMuted}>نامشخص</span>;
  }

  if (status.status === 'ready') {
    return <span className={styles.statusPillSuccess}>آماده ورود</span>;
  }

  if (status.status === 'creatable') {
    return <span className={styles.statusPillWarning}>قابل ایجاد</span>;
  }

  return <span className={styles.statusPillMuted}>غیرمجاز</span>;
}

function WorkspaceSummaryCard({
  projectUuid,
  entityUuid,
  entityName,
  entityCode,
  workspaceType,
  status,
  isLoading,
  isFetching,
  isError,
  errorSummary,
  onSelect,
  onCreate,
  onOpen,
  createPending,
}: {
  projectUuid: string;
  entityUuid: string;
  entityName: string;
  entityCode?: string | null;
  workspaceType: WorkspaceType;
  status: EnhancedCanvasWorkspaceStatus | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorSummary: string[];
  onSelect: (workspaceType: WorkspaceType) => void;
  onCreate: (workspaceType: WorkspaceType) => void;
  onOpen: (workspaceType: WorkspaceType, workspaceUuid: string) => void;
  createPending: boolean;
}) {
  const workspaceTitle = getWorkspaceTitle(workspaceType);
  const workspaceDisplayName = getWorkspaceDisplayName(workspaceType);
  const eligibilityLabel = getWorkspaceEligibilityLabel(workspaceType);
  const workspaceName = buildWorkspaceName(
    entityName,
    entityCode,
    workspaceDisplayName
  );

  const canOpen = Boolean(status?.status === 'ready' && status.workspaceUuid);
  const canCreate = Boolean(status?.status === 'creatable');
  const isAllowed = Boolean(status?.isAllowed);
  const hasWorkspace = Boolean(status?.hasWorkspace);
  const hasModel = Boolean(status?.hasModel);

  return (
    <div className={styles.selectorCard}>
      <div className={styles.selectorCardHeader}>
        <div className={styles.selectorCardTitleWrap}>
          <div className={styles.selectorIcon}>
            <Boxes size={18} />
          </div>
          <div>
            <div className={styles.selectorEyebrow}>WORKSPACE TYPE</div>
            <h4 className={styles.selectorTitle}>{workspaceTitle}</h4>
          </div>
        </div>

        {getStatusPill(status)}
      </div>

      <div className={styles.selectorMeta}>
        <div className={styles.selectorMetaRow}>
          <span className={styles.label}>{eligibilityLabel}</span>
          <span className={isAllowed ? styles.badgeSuccess : styles.badgeMuted}>
            {isAllowed ? 'مجاز' : 'غیرمجاز'}
          </span>
        </div>

        <div className={styles.selectorMetaRow}>
          <span className={styles.label}>Workspace</span>
          <span
            className={
              hasWorkspace
                ? styles.badgeSuccess
                : canCreate
                  ? styles.badgeWarning
                  : styles.badgeMuted
            }
          >
            {hasWorkspace ? 'ایجاد شده' : canCreate ? 'قابل ایجاد' : 'ناموجود/غیرمجاز'}
          </span>
        </div>

        <div className={styles.selectorMetaRow}>
          <span className={styles.label}>Model</span>
          <span className={hasModel ? styles.badgeSuccess : styles.badgeMuted}>
            {hasModel ? 'موجود' : 'هنوز موجود نیست'}
          </span>
        </div>
      </div>

      <div className={styles.selectorDescription}>
        {isLoading ? (
          <div className={styles.inlineLoading}>
            <Loader2 size={14} className={styles.spinner} />
            <span>در حال دریافت وضعیت...</span>
          </div>
        ) : isError ? (
          <div className={styles.inlineError}>
            <AlertTriangle size={14} />
            <span>
              {errorSummary[0] ?? `خطا در بررسی وضعیت ${workspaceDisplayName}`}
            </span>
          </div>
        ) : status?.status === 'ready' ? (
          <p>
            Workspace نوع {workspaceDisplayName} برای این موجودیت از قبل ایجاد شده
            و آماده ورود است.
          </p>
        ) : status?.status === 'creatable' ? (
          <p>
            این موجودیت واجد شرایط ایجاد Workspace نوع {workspaceDisplayName} است.
          </p>
        ) : (
          <p>
            این موجودیت در حال حاضر مجاز به استفاده از Workspace نوع{' '}
            {workspaceDisplayName} نیست.
          </p>
        )}
      </div>

      {!isLoading && !isError ? (
        <div className={styles.selectorWorkspaceName}>
          <span className={styles.label}>نام پیشنهادی Workspace</span>
          <span className={styles.value}>{workspaceName}</span>
        </div>
      ) : null}

      <div className={styles.selectorActions}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSelect(workspaceType)}
          disabled={createPending}
        >
          جزئیات
        </Button>

        {canOpen && status?.workspaceUuid ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onOpen(workspaceType, status.workspaceUuid!)}
            disabled={createPending || isFetching}
          >
            <span className={styles.buttonContent}>
              <ExternalLink size={14} />
              ورود
            </span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onCreate(workspaceType)}
            disabled={!canCreate || createPending || isFetching || isLoading || isError}
          >
            <span className={styles.buttonContent}>
              {createPending ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <PlusCircle size={14} />
                  {getWorkspaceCreateLabel(workspaceType)}
                </>
              )}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EntityWorkspaceModal({ projectUuid }: Props) {
  const workspaceModalEntityUuid = useCanvasStore(
    (s) => s.workspaceModalEntityUuid
  );
  const workspaceModalType = useCanvasStore((s) => s.workspaceModalType);
  const setWorkspaceModalType = useCanvasStore((s) => s.setWorkspaceModalType);
  const closeWorkspaceModal = useCanvasStore((s) => s.closeWorkspaceModal);
  const entities = useCanvasStore((s) => s.entities);

  const selectedEntity = useMemo(() => {
    if (!workspaceModalEntityUuid) return null;
    return entities.find((item) => item.uuid === workspaceModalEntityUuid) ?? null;
  }, [entities, workspaceModalEntityUuid]);

  const isOpen = Boolean(workspaceModalEntityUuid && selectedEntity);

  const femQuery = useWorkspaceStatus(
    projectUuid,
    workspaceModalEntityUuid,
    'FEM'
  );

  const cadQuery = useWorkspaceStatus(
    projectUuid,
    workspaceModalEntityUuid,
    'CAD'
  );

  const activeType = workspaceModalType;
  const activeQuery =
    activeType === 'CAD' ? cadQuery : activeType === 'FEM' ? femQuery : null;

  const createMutation = useCreateWorkspace(projectUuid);

  const femErrorSummary = useMemo(() => {
    if (!femQuery.isError) return [];
    return buildSystemEntityErrorSummary(parseSystemErrors(femQuery.error));
  }, [femQuery.isError, femQuery.error]);

  const cadErrorSummary = useMemo(() => {
    if (!cadQuery.isError) return [];
    return buildSystemEntityErrorSummary(parseSystemErrors(cadQuery.error));
  }, [cadQuery.isError, cadQuery.error]);

  const createErrorSummary = useMemo(() => {
    if (!createMutation.error) return [];
    return buildSystemEntityErrorSummary(parseSystemErrors(createMutation.error));
  }, [createMutation.error]);

  if (!workspaceModalEntityUuid || !selectedEntity) {
    return null;
  }

  const handleClose = () => {
    if (createMutation.isPending) return;
    closeWorkspaceModal();
  };

  const handleBackToSelector = () => {
    if (createMutation.isPending) return;
    setWorkspaceModalType(null);
  };

  const handleOpenWorkspace = (
    workspaceType: WorkspaceType,
    workspaceUuid: string
  ) => {
    const href = buildWorkspaceHref(projectUuid, workspaceType, workspaceUuid);
    closeWorkspaceModal();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleCreate = async (workspaceType: WorkspaceType) => {
    const workspaceDisplayName = getWorkspaceDisplayName(workspaceType);
    const workspaceName = buildWorkspaceName(
      selectedEntity.name,
      selectedEntity.code,
      workspaceDisplayName
    );

    try {
      await createMutation.mutateAsync({
        systemEntityUuid: workspaceModalEntityUuid,
        workspaceType,
        name: workspaceName,
        metadata: {
          source: 'canvas_entity_workspace_modal',
          system_entity_uuid: workspaceModalEntityUuid,
          system_entity_name: selectedEntity.name,
          system_entity_code: selectedEntity.code ?? null,
          system_entity_type: selectedEntity.entityType ?? null,
          workspace_type: workspaceType,
        },
      });

      if (workspaceType === 'FEM') {
        await femQuery.refetch();
      } else {
        await cadQuery.refetch();
      }

      setWorkspaceModalType(workspaceType);
    } catch {
      // handled by mutation state
    }
  };

  const renderSelectorMode = () => {
    return (
      <>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Cpu size={20} />
          </div>

          <div className={styles.heroText}>
            <div className={styles.eyebrow}>ENGINEERING WORKSPACES</div>
            <h3 className={styles.heroTitle}>
              انتخاب Workspace برای موجودیت سیستمی
            </h3>
            <p className={styles.heroSubtitle}>
              برای موجودیت انتخاب‌شده می‌توانید وضعیت Workspaceهای FEM و CAD را
              بررسی کنید، در صورت مجاز بودن Workspace جدید بسازید یا وارد
              Workspace موجود شوید.
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
                {selectedEntity.entityType ?? 'SYSTEM ENTITY'}
              </span>
            </div>

            <div className={styles.entityGrid}>
              <div className={styles.fieldItem}>
                <span className={styles.label}>نام</span>
                <span className={styles.value}>{selectedEntity.name}</span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>کد</span>
                <span className={styles.valueMono}>
                  {selectedEntity.code || '—'}
                </span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نوع نمایشی</span>
                <span className={styles.value}>
                  {selectedEntity.entityType ?? '—'}
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

          <div className={styles.selectorGrid}>
            <WorkspaceSummaryCard
              projectUuid={projectUuid}
              entityUuid={workspaceModalEntityUuid}
              entityName={selectedEntity.name}
              entityCode={selectedEntity.code ?? null}
              workspaceType="FEM"
              status={femQuery.data}
              isLoading={femQuery.isLoading}
              isFetching={femQuery.isFetching}
              isError={femQuery.isError}
              errorSummary={femErrorSummary}
              onSelect={(type) => setWorkspaceModalType(type)}
              onCreate={handleCreate}
              onOpen={handleOpenWorkspace}
              createPending={createMutation.isPending}
            />

            <WorkspaceSummaryCard
              projectUuid={projectUuid}
              entityUuid={workspaceModalEntityUuid}
              entityName={selectedEntity.name}
              entityCode={selectedEntity.code ?? null}
              workspaceType="CAD"
              status={cadQuery.data}
              isLoading={cadQuery.isLoading}
              isFetching={cadQuery.isFetching}
              isError={cadQuery.isError}
              errorSummary={cadErrorSummary}
              onSelect={(type) => setWorkspaceModalType(type)}
              onCreate={handleCreate}
              onOpen={handleOpenWorkspace}
              createPending={createMutation.isPending}
            />
          </div>

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
            ابتدا نوع Workspace موردنظر را انتخاب کنید. سپس می‌توانید وارد
            Workspace موجود شوید یا در صورت مجاز بودن، Workspace جدید بسازید.
          </div>

          <div className={styles.footerActions}>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              بستن
            </Button>
          </div>
        </div>
      </>
    );
  };

  const renderDetailMode = () => {
    if (!activeType || !activeQuery) return null;

    const workspaceTitle = getWorkspaceTitle(activeType);
    const workspaceDisplayName = getWorkspaceDisplayName(activeType);
    const workspaceCreateLabel = getWorkspaceCreateLabel(activeType);
    const eligibilityLabel = getWorkspaceEligibilityLabel(activeType);

    const workspaceName = buildWorkspaceName(
      selectedEntity.name,
      selectedEntity.code,
      workspaceDisplayName
    );

    const workspaceStatus = activeQuery.data;
    const status = workspaceStatus?.status ?? null;

    const hasWorkspace = status === 'ready';
    const isCreatable = status === 'creatable';
    const isNotAllowed = status === 'not_allowed';
    const isAllowed = !isNotAllowed && Boolean(workspaceStatus?.isAllowed);

    const hasModel = Boolean(workspaceStatus?.hasModel);
    const modelUuid = workspaceStatus?.modelUuid ?? null;

    const createDisabled =
      !activeQuery.canCreate ||
      !isCreatable ||
      createMutation.isPending ||
      activeQuery.isLoading ||
      activeQuery.isFetching ||
      activeQuery.isError;

    const statusErrorSummary = activeQuery.isError
      ? buildSystemEntityErrorSummary(parseSystemErrors(activeQuery.error))
      : [];

    const statusPill = hasWorkspace ? (
      <span className={styles.statusPillSuccess}>متصل</span>
    ) : isCreatable ? (
      <span className={styles.statusPillWarning}>آماده ایجاد</span>
    ) : (
      <span className={styles.statusPillMuted}>غیرمجاز</span>
    );

    return (
      <>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Cpu size={20} />
          </div>

          <div className={styles.heroText}>
            <div className={styles.eyebrow}>ENGINEERING WORKSPACE</div>
            <h3 className={styles.heroTitle}>
              مدیریت {workspaceTitle} برای موجودیت سیستمی
            </h3>
            <p className={styles.heroSubtitle}>
              وضعیت اتصال این موجودیت به Workspace نوع {workspaceDisplayName} از
              API دریافت می‌شود. اگر مجاز باشد می‌توانید Workspace را ایجاد کنید
              و اگر از قبل وجود داشته باشد، مستقیماً وارد آن شوید.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.topActions}>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBackToSelector}
              disabled={createMutation.isPending}
            >
              <span className={styles.buttonContent}>
                <ArrowRight size={14} />
                بازگشت به انتخاب نوع Workspace
              </span>
            </Button>
          </div>

          <div className={styles.entityCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <DatabaseZap size={16} />
                <span>موجودیت انتخاب‌شده</span>
              </div>

              <span className={styles.entityTypePill}>
                {selectedEntity.entityType ?? 'SYSTEM ENTITY'}
              </span>
            </div>

            <div className={styles.entityGrid}>
              <div className={styles.fieldItem}>
                <span className={styles.label}>نام</span>
                <span className={styles.value}>{selectedEntity.name}</span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>کد</span>
                <span className={styles.valueMono}>
                  {selectedEntity.code || '—'}
                </span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نوع نمایشی</span>
                <span className={styles.value}>
                  {selectedEntity.entityType ?? '—'}
                </span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نوع سیستم</span>
                <span className={styles.value}>
                  {selectedEntity.systemType?.name ?? '—'}
                </span>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.label}>نام Workspace</span>
                <span className={styles.value}>{workspaceName}</span>
              </div>
            </div>
          </div>

          {activeQuery.isLoading ? (
            <div className={styles.loadingBox}>
              <div className={styles.messageIconInfo}>
                <Loader2 size={17} className={styles.spinner} />
              </div>

              <div className={styles.messageBody}>
                <div className={styles.stateTitle}>
                  در حال بررسی وضعیت Workspace...
                </div>
                <p className={styles.stateText}>
                  سیستم در حال بررسی وضعیت اتصال موجودیت انتخاب‌شده به Workspace
                  نوع {workspaceDisplayName} است.
                </p>
              </div>
            </div>
          ) : activeQuery.isError ? (
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
                    onClick={() => activeQuery.refetch()}
                    disabled={activeQuery.isFetching}
                  >
                    {activeQuery.isFetching ? 'در حال تلاش...' : 'تلاش مجدد'}
                  </Button>
                </div>
              </div>
            </div>
          ) : workspaceStatus ? (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <div className={styles.cardTitle}>
                  <ShieldCheck size={16} />
                  <span>وضعیت {workspaceTitle}</span>
                </div>

                {statusPill}
              </div>

              <div className={styles.statusRows}>
                <div className={styles.statusRow}>
                  <span className={styles.label}>{eligibilityLabel}</span>
                  <span className={isAllowed ? styles.badgeSuccess : styles.badgeMuted}>
                    {isAllowed ? 'مجاز' : 'غیرمجاز'}
                  </span>
                </div>

                <div className={styles.statusRow}>
                  <span className={styles.label}>وضعیت Workspace</span>
                  <span
                    className={
                      hasWorkspace
                        ? styles.badgeSuccess
                        : isCreatable
                          ? styles.badgeWarning
                          : styles.badgeMuted
                    }
                  >
                    {hasWorkspace
                      ? 'ایجاد شده'
                      : isCreatable
                        ? 'موجود نیست'
                        : 'قابل ایجاد نیست'}
                  </span>
                </div>

                <div className={styles.statusRow}>
                  <span className={styles.label}>وضعیت Model</span>
                  <span className={hasModel ? styles.badgeSuccess : styles.badgeMuted}>
                    {hasModel
                      ? `مدل ${workspaceDisplayName} موجود است`
                      : `مدل ${workspaceDisplayName} هنوز ساخته نشده`}
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

                {modelUuid ? (
                  <div className={styles.statusRow}>
                    <span className={styles.label}>{workspaceDisplayName} Model UUID</span>
                    <span className={styles.valueMono}>{modelUuid}</span>
                  </div>
                ) : null}
              </div>

              {status === 'not_allowed' ? (
                <div className={styles.infoBoxMuted}>
                  <XCircle size={16} />
                  <span>
                    این موجودیت مجاز به داشتن Workspace نوع {workspaceDisplayName}{' '}
                    نیست.
                  </span>
                </div>
              ) : status === 'ready' ? (
                <div className={styles.infoBoxMuted}>
                  <CheckCircle2 size={16} />
                  <span>
                    Workspace نوع {workspaceDisplayName} برای این موجودیت از قبل
                    ایجاد شده است.
                  </span>
                </div>
              ) : status === 'creatable' ? (
                <div className={styles.infoBoxReady}>
                  <Info size={16} />
                  <span>
                    این موجودیت آماده ایجاد Workspace نوع {workspaceDisplayName} است.
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
            {status === 'ready'
              ? `Workspace نوع ${workspaceDisplayName} برای این موجودیت برقرار است.`
              : status === 'creatable'
                ? `در صورت تأیید، Workspace نوع ${workspaceDisplayName} برای این موجودیت ایجاد می‌شود.`
                : `این موجودیت مجاز به استفاده از Workspace نوع ${workspaceDisplayName} نیست.`}
          </div>

          <div className={styles.footerActions}>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              بستن
            </Button>

            {activeQuery.canOpen && workspaceStatus?.workspaceUuid ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  handleOpenWorkspace(activeType, workspaceStatus.workspaceUuid!)
                }
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
                onClick={() => handleCreate(activeType)}
                disabled={createDisabled}
              >
                {createMutation.isPending ? (
                  <span className={styles.buttonContent}>
                    <Loader2 size={14} className={styles.spinner} />
                    در حال ایجاد...
                  </span>
                ) : (
                  workspaceCreateLabel
                )}
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        activeType
          ? `مدیریت ${getWorkspaceTitle(activeType)} برای موجودیت سیستمی`
          : 'انتخاب Workspace برای موجودیت سیستمی'
      }
      size="xl"
      closeOnBackdrop={!createMutation.isPending}
    >
      <div
        className={styles.container}
        dir="rtl"
        onKeyDown={(event) => event.stopPropagation()}
      >
        {activeType ? renderDetailMode() : renderSelectorMode()}
      </div>
    </Modal>
  );
}
