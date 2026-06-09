// src/components/canvas/EntityWorkspaceModal.tsx

'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Cpu,
  ExternalLink,
  Loader2,
  PlusCircle,
} from 'lucide-react';

import Button from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { useCreateWorkspace, useWorkspaceStatus } from '@/hooks/useWorkspaceModel';
import { createDesignModel } from '@/lib/api/designModels';
import { buildSystemEntityErrorSummary, parseSystemErrors } from '@/lib/api/system';
import {
  buildWorkspaceHref,
  type EnhancedCanvasWorkspaceStatus,
  type WorkspaceType,
} from '@/lib/types/workspace.types';
import {
  getWorkspaceCreateLabel,
  getWorkspaceDisplayName,
  getWorkspaceEligibilityLabel,
  getWorkspaceTitle,
} from '@/lib/workspace/workspace-ui';
import { useCanvasStore } from '@/store/useCanvasStore';

import styles from './EntityWorkspaceModal.module.css';

type Props = {
  projectUuid: string;
};

type WorkspaceSummaryCardProps = {
  entityName: string;
  entityCode: string | null | undefined;
  workspaceType: WorkspaceType;
  status: EnhancedCanvasWorkspaceStatus | null | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorSummary: string[];
  onSelect: (workspaceType: WorkspaceType) => void;
  onCreate: (workspaceType: WorkspaceType) => void;
  onOpen: (workspaceType: WorkspaceType, uuid: string) => void;
  createPending: boolean;
};

function buildWorkspaceName(
  entityName: string,
  entityCode: string | null | undefined,
  workspaceDisplayName: string
): string {
  const safeName = String(entityName || '').trim();
  const safeCode = String(entityCode || '').trim();

  return safeCode
    ? `${safeName} - ${workspaceDisplayName} Workspace (${safeCode})`
    : `${safeName} - ${workspaceDisplayName} Workspace`;
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
}: WorkspaceSummaryCardProps) {
  const workspaceTitle = getWorkspaceTitle(workspaceType);
  const workspaceDisplayName = getWorkspaceDisplayName(workspaceType);
  const eligibilityLabel = getWorkspaceEligibilityLabel(workspaceType);
  const workspaceName = buildWorkspaceName(
    entityName,
    entityCode,
    workspaceDisplayName
  );

  const canOpen = status?.status === 'ready' && Boolean(status.workspaceUuid);
  const canCreate = status?.status === 'creatable';
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
            <span>{errorSummary[0] ?? `خطا در بررسی وضعیت ${workspaceDisplayName}`}</span>
          </div>
        ) : (
          <p>
            {status?.status === 'ready'
              ? `Workspace نوع ${workspaceDisplayName} برای این موجودیت از قبل ایجاد شده و آماده ورود است.`
              : status?.status === 'creatable'
                ? `این موجودیت واجد شرایط ایجاد Workspace نوع ${workspaceDisplayName} است.`
                : `این موجودیت در حال حاضر مجاز به استفاده از Workspace نوع ${workspaceDisplayName} نیست.`}
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
            onClick={() => onOpen(workspaceType, status.workspaceUuid as string)}
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
  const workspaceModalEntityUuid = useCanvasStore((s) => s.workspaceModalEntityUuid);
  const workspaceModalType = useCanvasStore((s) => s.workspaceModalType);
  const openWorkspaceModal = useCanvasStore((s) => s.openWorkspaceModal);
  const closeWorkspaceModal = useCanvasStore((s) => s.closeWorkspaceModal);
  const entities = useCanvasStore((s) => s.entities);

  const [modelCreateError, setModelCreateError] = useState<string | null>(null);
  const [lastCreatedWorkspaceUuid, setLastCreatedWorkspaceUuid] = useState<string | null>(null);

  const selectedEntity = useMemo(() => {
    if (!workspaceModalEntityUuid) {
      return null;
    }

    return entities.find((item) => item.uuid === workspaceModalEntityUuid) ?? null;
  }, [entities, workspaceModalEntityUuid]);

  const isOpen = Boolean(workspaceModalEntityUuid && selectedEntity);

  const femQuery = useWorkspaceStatus(projectUuid, workspaceModalEntityUuid, 'FEM');
  const cadQuery = useWorkspaceStatus(projectUuid, workspaceModalEntityUuid, 'CAD');

  const activeType = workspaceModalType;
  const activeQuery =
    activeType === 'FEM' ? femQuery : activeType === 'CAD' ? cadQuery : null;

  const createMutation = useCreateWorkspace(projectUuid);

  const femErrorSummary = useMemo(() => {
    if (!femQuery.isError) {
      return [];
    }

    return buildSystemEntityErrorSummary(parseSystemErrors(femQuery.error));
  }, [femQuery.isError, femQuery.error]);

  const cadErrorSummary = useMemo(() => {
    if (!cadQuery.isError) {
      return [];
    }

    return buildSystemEntityErrorSummary(parseSystemErrors(cadQuery.error));
  }, [cadQuery.isError, cadQuery.error]);

  const createErrorSummary = useMemo(() => {
    if (!createMutation.error) {
      return [];
    }

    return buildSystemEntityErrorSummary(parseSystemErrors(createMutation.error));
  }, [createMutation.error]);

  const resetLocalState = () => {
    setModelCreateError(null);
    setLastCreatedWorkspaceUuid(null);
  };

  const handleClose = () => {
    if (createMutation.isPending) {
      return;
    }

    resetLocalState();
    closeWorkspaceModal();
  };


  const handleBackToSelector = () => {
    if (createMutation.isPending || !workspaceModalEntityUuid) {
      return;
    }

    setModelCreateError(null);
    openWorkspaceModal(workspaceModalEntityUuid, null);
  };


  const handleSelectWorkspaceType = (type: WorkspaceType) => {
    if (!workspaceModalEntityUuid) {
      return;
    }

    openWorkspaceModal(workspaceModalEntityUuid, type);
  };

  const handleOpenWorkspace = (type: WorkspaceType, uuid: string) => {
    const href = buildWorkspaceHref(projectUuid, type, uuid);
    closeWorkspaceModal();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleCreate = async (workspaceType: WorkspaceType) => {
    if (!selectedEntity || !workspaceModalEntityUuid) {
      return;
    }

    setModelCreateError(null);
    setLastCreatedWorkspaceUuid(null);

    const workspaceDisplayName = getWorkspaceDisplayName(workspaceType);
    const workspaceName = buildWorkspaceName(
      selectedEntity.name,
      selectedEntity.code,
      workspaceDisplayName
    );

    try {
      const newWorkspace = await createMutation.mutateAsync({
        systemEntityUuid: workspaceModalEntityUuid,
        workspaceType,
        name: workspaceName,
        metadata: {
          source: 'canvas_entity_workspace_modal',
          system_entity_uuid: workspaceModalEntityUuid,
        },
      });

      setLastCreatedWorkspaceUuid(newWorkspace.uuid);

      if (workspaceType === 'FEM' && newWorkspace.uuid) {
        const entityCode = String(selectedEntity.code ?? '').trim();

        if (entityCode) {
          try {
            await createDesignModel({
              project_uuid: projectUuid,
              workspace_uuid: newWorkspace.uuid,
              system_entity_uuid: workspaceModalEntityUuid,
              workspace_type: 'FEM',
              code: entityCode,
              name: `${selectedEntity.name} - Default FEM Model`,
              metadata: {
                source: 'auto_created_with_workspace',
                workspace_uuid: newWorkspace.uuid,
                system_entity_uuid: workspaceModalEntityUuid,
              },
            });
          } catch (modelError) {
            const message =
              modelError instanceof Error
                ? modelError.message
                : 'Workspace ایجاد شد اما ساخت Design Model با خطا مواجه شد.';

            setModelCreateError(message);
            console.error('Design model creation failed after workspace creation:', modelError);
          }
        } else {
          setModelCreateError(
            'Workspace ایجاد شد اما به دلیل نداشتن code برای موجودیت، Design Model ساخته نشد.'
          );
        }
      }

      if (workspaceType === 'FEM') {
        await femQuery.refetch();
      } else {
        await cadQuery.refetch();
      }

      openWorkspaceModal(workspaceModalEntityUuid, workspaceType);
    } catch (workspaceError) {
      console.error('Workspace creation failed:', workspaceError);
    }
  };

  const renderSelectorMode = () => {
    if (!selectedEntity) {
      return null;
    }

    return (
      <>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Cpu size={20} />
          </div>

          <div className={styles.heroText}>
            <div className={styles.eyebrow}>ENGINEERING WORKSPACES</div>
            <h3 className={styles.heroTitle}>انتخاب Workspace برای موجودیت سیستمی</h3>
            <p className={styles.heroSubtitle}>
              برای موجودیت انتخاب‌شده می‌توانید وضعیت Workspaceهای FEM و CAD را بررسی کنید.
            </p>
          </div>
        </div>

        {(createErrorSummary.length > 0 || modelCreateError) && (
          <div className={styles.globalErrorBox}>
            <div className={styles.inlineError}>
              <AlertTriangle size={16} />
              <div>
                {createErrorSummary.length > 0 ? (
                  createErrorSummary.map((item, index) => <div key={index}>{item}</div>)
                ) : (
                  <div>{modelCreateError}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.selectorGrid}>
            <WorkspaceSummaryCard
              entityName={selectedEntity.name}
              entityCode={selectedEntity.code}
              workspaceType="FEM"
              status={femQuery.data}
              isLoading={femQuery.isLoading}
              isFetching={femQuery.isFetching}
              isError={femQuery.isError}
              errorSummary={femErrorSummary}
              onSelect={handleSelectWorkspaceType}
              onCreate={handleCreate}
              onOpen={handleOpenWorkspace}
              createPending={createMutation.isPending}
            />

            <WorkspaceSummaryCard
              entityName={selectedEntity.name}
              entityCode={selectedEntity.code}
              workspaceType="CAD"
              status={cadQuery.data}
              isLoading={cadQuery.isLoading}
              isFetching={cadQuery.isFetching}
              isError={cadQuery.isError}
              errorSummary={cadErrorSummary}
              onSelect={handleSelectWorkspaceType}
              onCreate={handleCreate}
              onOpen={handleOpenWorkspace}
              createPending={createMutation.isPending}
            />
          </div>
        </div>

        <div className={styles.footer}>
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
    if (!activeType || !activeQuery) {
      return null;
    }

    const workspaceStatus = activeQuery.data;
    const hasWorkspace = workspaceStatus?.status === 'ready';
    const workspaceUuid = workspaceStatus?.workspaceUuid ?? lastCreatedWorkspaceUuid ?? null;

    return (
      <>
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>WORKSPACE DETAILS</div>
            <h3 className={styles.heroTitle}>مدیریت {getWorkspaceTitle(activeType)}</h3>
            <p className={styles.heroSubtitle}>
              وضعیت این Workspace را بررسی کنید و در صورت نیاز آن را ایجاد یا باز کنید.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.selectorCard}>
            <div className={styles.selectorCardHeader}>
              <div className={styles.selectorCardTitleWrap}>
                <div className={styles.selectorIcon}>
                  <Boxes size={18} />
                </div>

                <div>
                  <div className={styles.selectorEyebrow}>ACTIVE WORKSPACE</div>
                  <h4 className={styles.selectorTitle}>{getWorkspaceTitle(activeType)}</h4>
                </div>
              </div>

              {getStatusPill(workspaceStatus)}
            </div>

            <div className={styles.selectorMeta}>
              <div className={styles.selectorMetaRow}>
                <span className={styles.label}>نوع Workspace</span>
                <span className={styles.badgeMuted}>
                  {getWorkspaceDisplayName(activeType)}
                </span>
              </div>

              <div className={styles.selectorMetaRow}>
                <span className={styles.label}>وضعیت</span>
                <span
                  className={
                    hasWorkspace
                      ? styles.badgeSuccess
                      : workspaceStatus?.status === 'creatable'
                        ? styles.badgeWarning
                        : styles.badgeMuted
                  }
                >
                  {hasWorkspace
                    ? 'آماده ورود'
                    : workspaceStatus?.status === 'creatable'
                      ? 'قابل ایجاد'
                      : 'غیرمجاز'}
                </span>
              </div>

              <div className={styles.selectorMetaRow}>
                <span className={styles.label}>Workspace UUID</span>
                <span className={styles.value}>{workspaceUuid ?? '—'}</span>
              </div>
            </div>

            {createErrorSummary.length > 0 && (
              <div className={styles.globalErrorBox}>
                <div className={styles.inlineError}>
                  <AlertTriangle size={16} />
                  <div>
                    {createErrorSummary.map((item, index) => (
                      <div key={index}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modelCreateError && (
              <div className={styles.globalErrorBox}>
                <div className={styles.inlineError}>
                  <AlertTriangle size={16} />
                  <div>{modelCreateError}</div>
                </div>
              </div>
            )}

            <div className={styles.selectorActions}>
              {hasWorkspace && workspaceUuid ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenWorkspace(activeType, workspaceUuid)}
                  disabled={createMutation.isPending}
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
                  disabled={
                    createMutation.isPending ||
                    activeQuery.isLoading ||
                    activeQuery.isFetching ||
                    activeQuery.isError ||
                    activeQuery.data?.status !== 'creatable'
                  }
                >
                  <span className={styles.buttonContent}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 size={14} className={styles.spinner} />
                        در حال ایجاد...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={14} />
                        {getWorkspaceCreateLabel(activeType)}
                      </>
                    )}
                  </span>
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={handleBackToSelector}
                disabled={createMutation.isPending}
              >
                بازگشت
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (!workspaceModalEntityUuid || !selectedEntity) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={activeType ? 'مدیریت Workspace' : 'انتخاب Workspace'}
      size="xl"
      closeOnBackdrop={!createMutation.isPending}
    >
      <div
        className={styles.container}
        dir="rtl"
        onKeyDown={(e) => e.stopPropagation()}
      >
        {activeType ? renderDetailMode() : renderSelectorMode()}
      </div>
    </Modal>
  );
}
