// src/components/layout/PropertiesPanel.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorkspaceStatusStore } from '@/store/useWorkspaceStatusStore';

import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteSystemEntity } from '@/hooks/useDeleteSystemEntity';
import { useSystemEntityTypes } from '@/hooks/useSystemEntityTypes';
import { useWorkspaceStatus } from '@/hooks/useWorkspaceModel';

import type { ApiEntityType } from '@/lib/types/api.types';
import type { MetadataSchema, MetadataValues } from '@/lib/metadata/types';
import type {
  EnhancedCanvasWorkspaceStatus,
  WorkspaceType,
} from '@/lib/types/workspace.types';

import { buildWorkspaceHref } from '@/lib/types/workspace.types';

import {
  type ApiErrorMap,
  buildSystemEntityErrorSummary,
  FIELD_LABELS,
  getFirstSystemEntityFieldError,
  hasSystemEntityFieldError,
  parseSystemErrors,
  type UpdateSystemEntityPayload,
} from '@/lib/api/system';

import {
  buildMetadataOverrides,
  ensureMetadataConfig,
  getMetadataInitialValues,
  sanitizeMetadataForSubmit,
} from '@/lib/metadata/utils';

import MetadataForm from '@/components/metadata/MetadataForm';

import styles from './PropertiesPanel.module.css';

type EntityType = 'macro' | 'fem' | 'environment' | 'generic';

const ENTITY_TYPE_OPTIONS: Array<{
  value: EntityType;
  label: string;
}> = [
  { value: 'macro', label: 'Macro Structure' },
  { value: 'fem', label: 'Finite Element Model' },
  { value: 'environment', label: 'Environment' },
  { value: 'generic', label: 'Generic Node' },
];

const WORKSPACE_TYPES: WorkspaceType[] = ['FEM', 'CAD'];

function toFiniteNumber(value: string, fallback = 0): number {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getEntityAvatarText(name: string, code: string) {
  const source = code.trim() || name.trim() || 'NX';
  return source.slice(0, 2).toUpperCase();
}

function getWorkspaceLabel(type: WorkspaceType) {
  return type === 'CAD' ? 'CAD Workspace' : 'FEM Workspace';
}

function getWorkspacePersianLabel(type: WorkspaceType) {
  return type === 'CAD' ? 'فضای CAD' : 'فضای FEM';
}

function getWorkspaceStatusText(
  status: EnhancedCanvasWorkspaceStatus | null,
  isLoading: boolean
) {
  if (isLoading) return 'در حال بررسی';

  if (!status) return 'نامشخص';

  if (status.status === 'ready') return 'متصل';
  if (status.status === 'creatable') return 'قابل ایجاد';

  return 'غیرمجاز';
}

function getWorkspaceStatusClassName(
  status: EnhancedCanvasWorkspaceStatus | null,
  isLoading: boolean
) {
  if (isLoading) return styles.femStatusPillMuted;

  if (!status) return styles.femStatusPillMuted;

  if (status.status === 'ready') return styles.femStatusPillSuccess;
  if (status.status === 'creatable') return styles.femStatusPillWarning;

  return styles.femStatusPillMuted;
}

function getWorkspaceDescription(
  type: WorkspaceType,
  status: EnhancedCanvasWorkspaceStatus | null,
  isLoading: boolean
) {
  const label = getWorkspacePersianLabel(type);

  if (isLoading) {
    return `در حال دریافت وضعیت ${label} برای این موجودیت...`;
  }

  if (!status) {
    return `وضعیت ${label} هنوز دریافت نشده است.`;
  }

  if (status.status === 'ready') {
    return `${label} برای این موجودیت ساخته شده و آماده ورود است.`;
  }

  if (status.status === 'creatable') {
    return `این موجودیت مجاز است و می‌توانید ${label} را برای آن ایجاد کنید.`;
  }

  return `این موجودیت در حال حاضر مجاز به استفاده از ${label} نیست.`;
}

export const PropertiesPanel = () => {
  const params = useParams();

  const projectUuid =
    typeof params?.projectId === 'string'
      ? params.projectId
      : typeof params?.id === 'string'
        ? params.id
        : '';

  const scenarioId =
    typeof params?.scenarioId === 'string' ? params.scenarioId : undefined;

  const selectedEntityId = useCanvasStore((s) => s.selectedEntity);
  const entities = useCanvasStore((s) => s.entities);
  const removeEntity = useCanvasStore((s) => s.removeEntity);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const updateEntityProps = useCanvasStore((s) => s.updateEntityProps);
  const openWorkspaceModal = useCanvasStore((s) => s.openWorkspaceModal);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find((entity) => entity.uuid === selectedEntityId) ?? null;
  }, [entities, selectedEntityId]);

  const cachedFemWorkspaceStatus = useWorkspaceStatusStore((state) =>
    selectedEntity?.uuid
      ? state.getByEntityUuid(selectedEntity.uuid, 'FEM')
      : null
  );

  const cachedCadWorkspaceStatus = useWorkspaceStatusStore((state) =>
    selectedEntity?.uuid
      ? state.getByEntityUuid(selectedEntity.uuid, 'CAD')
      : null
  );

  const {
    data: fetchedFemWorkspaceStatus,
    isLoading: isFemWorkspaceStatusLoading,
  } = useWorkspaceStatus(projectUuid, selectedEntity?.uuid ?? null, 'FEM');

  const {
    data: fetchedCadWorkspaceStatus,
    isLoading: isCadWorkspaceStatusLoading,
  } = useWorkspaceStatus(projectUuid, selectedEntity?.uuid ?? null, 'CAD');

  const femWorkspaceStatus =
    fetchedFemWorkspaceStatus ?? cachedFemWorkspaceStatus ?? null;

  const cadWorkspaceStatus =
    fetchedCadWorkspaceStatus ?? cachedCadWorkspaceStatus ?? null;

  const workspaceStatuses: Record<
    WorkspaceType,
    {
      status: EnhancedCanvasWorkspaceStatus | null;
      isLoading: boolean;
    }
  > = {
    FEM: {
      status: femWorkspaceStatus,
      isLoading: isFemWorkspaceStatusLoading,
    },
    CAD: {
      status: cadWorkspaceStatus,
      isLoading: isCadWorkspaceStatusLoading,
    },
  };

  const readyWorkspaceCount = WORKSPACE_TYPES.filter(
    (type) => workspaceStatuses[type].status?.status === 'ready'
  ).length;

  const creatableWorkspaceCount = WORKSPACE_TYPES.filter(
    (type) => workspaceStatuses[type].status?.status === 'creatable'
  ).length;

  const isAnyWorkspaceLoading =
    isFemWorkspaceStatusLoading || isCadWorkspaceStatusLoading;

  const updateEntityMutation = useUpdateSystemEntity(projectUuid, scenarioId);
  const deleteEntityMutation = useDeleteSystemEntity(projectUuid, scenarioId);

  const { data: systemEntityTypes = [] } = useSystemEntityTypes();

  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<EntityType>('generic');

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [posZ, setPosZ] = useState(0);

  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [parentUuid, setParentUuid] = useState<string | null>(null);
  const [systemTypeUuid, setSystemTypeUuid] = useState<string | null>(null);

  const [metadataValues, setMetadataValues] = useState<MetadataValues>({});

  const [saveError, setSaveError] = useState<ApiErrorMap | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentSystemType = useMemo(() => {
    if (!systemTypeUuid) return null;
    return systemEntityTypes.find((type: any) => type.uuid === systemTypeUuid) ?? null;
  }, [systemTypeUuid, systemEntityTypes]);

  const currentMetadataConfig = useMemo(() => {
    if (!currentSystemType) {
      return { schema: {}, defaults: {} };
    }

    const explicitSchema = (currentSystemType as any).metadata_schema;
    const explicitDefaults = (currentSystemType as any).metadata_defaults;

    if (explicitSchema || explicitDefaults) {
      return {
        schema: explicitSchema ?? {},
        defaults: explicitDefaults ?? {},
      };
    }

    return ensureMetadataConfig((currentSystemType as any).metadata);
  }, [currentSystemType]);

  const currentMetadataSchema = currentMetadataConfig.schema as MetadataSchema;
  const currentMetadataDefaults =
    currentMetadataConfig.defaults as MetadataValues;

  const generalSaveErrors = useMemo(() => {
    if (!saveError) return [];
    return saveError.nonFieldErrors ?? [];
  }, [saveError]);

  const entityAvatarText = useMemo(() => {
    return getEntityAvatarText(editName, editCode);
  }, [editName, editCode]);

  const entityDisplayName = editName.trim() || 'Untitled System';
  const entityDisplayCode = editCode.trim() || 'NO-CODE';
  const entityDisplayType = editType || 'generic';
  const entityDisplaySystemType = currentSystemType?.code ?? 'NO-TYPE';

  const isUpdating = updateEntityMutation.isPending;
  const isDeleting = deleteEntityMutation.isPending;
  const isBusy = isUpdating || isDeleting;

  const nameError = getFirstSystemEntityFieldError(saveError, 'name');
  const codeError = getFirstSystemEntityFieldError(saveError, 'code');
  const descriptionError = getFirstSystemEntityFieldError(
    saveError,
    'description'
  );

  useEffect(() => {
    setSaveError(null);
    setDeleteError(null);
  }, [selectedEntityId]);

  useEffect(() => {
    if (!selectedEntity) {
      setEditName('');
      setEditCode('');
      setEditDescription('');
      setEditType('generic');
      setPosX(0);
      setPosY(0);
      setPosZ(0);
      setSortOrder(0);
      setIsActive(true);
      setParentUuid(null);
      setSystemTypeUuid(null);
      setMetadataValues({});
      return;
    }

    setEditName(selectedEntity.name ?? '');
    setEditCode(selectedEntity.code ?? '');
    setEditDescription(selectedEntity.description ?? '');
    setEditType((selectedEntity.entityType ?? 'generic') as EntityType);
    setPosX(selectedEntity.position?.[0] ?? 0);
    setPosY(selectedEntity.position?.[1] ?? 0);
    setPosZ(selectedEntity.position?.[2] ?? 0);
    setSortOrder(selectedEntity.sortOrder ?? 0);
    setIsActive(
      typeof selectedEntity.isActive === 'boolean'
        ? selectedEntity.isActive
        : true
    );
    setParentUuid(selectedEntity.parentId ?? null);
    setSystemTypeUuid(selectedEntity.systemType?.uuid ?? null);
  }, [selectedEntity]);

  useEffect(() => {
    if (!selectedEntity) {
      setMetadataValues({});
      return;
    }

    const effectiveMetadata =
      (selectedEntity as any).effective_metadata ??
      selectedEntity.metadata ??
      {};

    const nextMetadata = getMetadataInitialValues({
      schema: currentMetadataSchema,
      defaults: currentMetadataDefaults,
      values: effectiveMetadata,
    });

    setMetadataValues(nextMetadata);
  }, [
    selectedEntity?.uuid,
    systemTypeUuid,
    currentMetadataSchema,
    currentMetadataDefaults,
    selectedEntity,
  ]);

  const getInputClassName = (fieldName: string) => {
    return joinClassNames(
      styles.input,
      hasSystemEntityFieldError(saveError, fieldName) && styles.inputError
    );
  };

  const getTextareaClassName = (fieldName: string) => {
    return joinClassNames(
      styles.textarea,
      hasSystemEntityFieldError(saveError, fieldName) && styles.inputError
    );
  };

  const handleOpenWorkspaceManager = () => {
    if (!selectedEntity?.uuid || isBusy) return;
    openWorkspaceModal(selectedEntity.uuid, null);
  };

  const handleQuickOpenWorkspace = (workspaceType: WorkspaceType) => {
    if (!projectUuid || !selectedEntity) return;

    const status = workspaceStatuses[workspaceType].status;

    if (!status?.workspaceUuid) return;

    const href = buildWorkspaceHref(
      projectUuid,
      workspaceType,
      status.workspaceUuid
    );

    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    if (!selectedEntity || isBusy) return;

    if (!selectedEntity.uuid) {
      setSaveError({
        nonFieldErrors: ['شناسه موجودیت انتخاب‌شده معتبر نیست.'],
        fieldErrors: {},
      });
      return;
    }

    if (!projectUuid) {
      setSaveError({
        nonFieldErrors: ['شناسه پروژه از مسیر صفحه پیدا نشد.'],
        fieldErrors: {},
      });
      return;
    }

    setSaveError(null);

    const cleanedMetadata = sanitizeMetadataForSubmit(
      currentMetadataSchema,
      metadataValues
    );

    const metadataOverrides = buildMetadataOverrides(
      currentMetadataDefaults,
      cleanedMetadata
    );

    const payload: UpdateSystemEntityPayload = {
      name: editName.trim() || undefined,
      code: editCode.trim() || undefined,
      description: editDescription.trim() || undefined,
      entity_type: editType as ApiEntityType,
      pos_x: Number.isFinite(posX) ? posX : 0,
      pos_y: Number.isFinite(posY) ? posY : 0,
      pos_z: Number.isFinite(posZ) ? posZ : 0,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_active: isActive,
      parent: parentUuid ?? null,
      system_type_uuid: systemTypeUuid ?? null,
      metadata: metadataOverrides,
    };

    try {
      const updated = await updateEntityMutation.mutateAsync({
        entityUuid: selectedEntity.uuid,
        payload,
      });

      setSaveError(null);

const selectedSystemType =
  systemEntityTypes.find((type: any) => type.uuid === systemTypeUuid) ??
  selectedEntity.systemType ??
  null;

const nextMetadata =
  (updated as any).effective_metadata ??
  (updated as any).effectiveMetadata ??
  cleanedMetadata ??
  metadataValues ??
  selectedEntity.metadata ??
  {};

    updateEntityProps(selectedEntity.uuid, {
      name: (updated as any).name ?? payload.name ?? selectedEntity.name,
      code: (updated as any).code ?? payload.code ?? selectedEntity.code,
      description:
        (updated as any).description ??
        payload.description ??
        selectedEntity.description,

      entityType:
        ((updated as any).entity_type as any) ??
        (updated as any).entityType ??
        payload.entity_type ??
        selectedEntity.entityType,

      position: [
        (updated as any).pos_x ??
          (updated as any).posX ??
          payload.pos_x ??
          selectedEntity.position?.[0] ??
          0,
        (updated as any).pos_y ??
          (updated as any).posY ??
          payload.pos_y ??
          selectedEntity.position?.[1] ??
          0,
        (updated as any).pos_z ??
          (updated as any).posZ ??
          payload.pos_z ??
          selectedEntity.position?.[2] ??
          0,
      ],

      sortOrder:
        (updated as any).sort_order ??
        (updated as any).sortOrder ??
        payload.sort_order ??
        selectedEntity.sortOrder,

      isActive:
        (updated as any).is_active ??
        (updated as any).isActive ??
        payload.is_active ??
        selectedEntity.isActive,

      parentId:
        (updated as any).parent ??
        (updated as any).parent_uuid ??
        (updated as any).parentUuid ??
        payload.parent ??
        selectedEntity.parentId ??
        null,

      systemType:
        (updated as any).system_type ??
        (updated as any).systemType ??
        selectedSystemType,

      metadata: nextMetadata,

      effective_metadata: nextMetadata,
      effectiveMetadata: nextMetadata,

      updatedAt:
        (updated as any).updated_at ??
        (updated as any).updatedAt ??
        new Date().toISOString(),
    } as any);
    } catch (error) {
      const parsed = parseSystemErrors(error);
      setSaveError(parsed);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntity || isBusy) return;

    const confirmed = window.confirm(
      `آیا از حذف موجودیت «${
        selectedEntity.name ?? selectedEntity.uuid
      }» مطمئن هستید؟`
    );

    if (!confirmed) return;

    try {
      await deleteEntityMutation.mutateAsync(selectedEntity.uuid);
      removeEntity(selectedEntity.uuid);
      clearSelection();
    } catch (error) {
      const parsed = parseSystemErrors(error);
      const summary = buildSystemEntityErrorSummary(parsed);
      setDeleteError(summary[0] ?? 'حذف موجودیت با خطا مواجه شد.');
    }
  };

  return (
    <div className={styles.propertiesPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderMain}>
          <span className={styles.panelEyebrow}>
            Inspector // Node Properties
          </span>
          <h3 className={styles.panelTitle}>مشخصات سیستم</h3>
          <span className={styles.panelSubtitle}>
            ویرایش ساختار، مختصات و متادیتای موجودیت انتخاب‌شده
          </span>
        </div>

        <div className={styles.panelHeaderActions}>
          {selectedEntity ? (
            <span className={styles.panelStateActive}>Selected</span>
          ) : (
            <span className={styles.panelStateIdle}>Idle</span>
          )}

          {selectedEntity ? (
            <button
              type="button"
              className={styles.clearSelectionBtn}
              onClick={clearSelection}
              title="پاک کردن انتخاب"
              disabled={isBusy}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {!selectedEntity ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyOrb}>
            <span>◇</span>
          </div>
          <div className={styles.emptyContent}>
            <p>هیچ موجودیتی انتخاب نشده است</p>
            <span>
              یک Node یا System Entity را از روی Canvas انتخاب کنید تا Inspector
              فعال شود.
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.propertiesForm}>
          {generalSaveErrors.length > 0 ? (
            <div className={styles.errorBox}>
              {generalSaveErrors.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </div>
          ) : null}

          {deleteError ? (
            <div className={styles.errorBox}>{deleteError}</div>
          ) : null}

          <div className={styles.entitySummaryCard}>
            <div className={styles.entityAvatar}>{entityAvatarText}</div>
            <div className={styles.entitySummaryMain}>
              <span className={styles.entitySummaryLabel}>Selected Entity</span>
              <strong title={entityDisplayName}>{entityDisplayName}</strong>
              <div className={styles.entitySummaryMeta}>
                <span>{entityDisplayCode}</span>
                <span>{entityDisplayType}</span>
                <span>{entityDisplaySystemType}</span>
              </div>
            </div>
          </div>

          <div className={styles.femWorkspaceCard}>
            <div className={styles.femWorkspaceHeader}>
              <div>
                <span className={styles.femWorkspaceEyebrow}>
                  ENGINEERING WORKSPACES
                </span>
                <strong>فضاهای مهندسی</strong>
              </div>

              {isAnyWorkspaceLoading ? (
                <span className={styles.femStatusPillMuted}>
                  در حال بررسی...
                </span>
              ) : readyWorkspaceCount > 0 ? (
                <span className={styles.femStatusPillSuccess}>
                  {readyWorkspaceCount} متصل
                </span>
              ) : creatableWorkspaceCount > 0 ? (
                <span className={styles.femStatusPillWarning}>
                  {creatableWorkspaceCount} قابل ایجاد
                </span>
              ) : (
                <span className={styles.femStatusPillMuted}>غیرمجاز</span>
              )}
            </div>

            <p className={styles.femWorkspaceText}>
              وضعیت Workspaceهای FEM و CAD این موجودیت را بررسی کنید، Workspace
              جدید بسازید یا وارد Workspace موجود شوید.
            </p>

            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {WORKSPACE_TYPES.map((workspaceType) => {
                const item = workspaceStatuses[workspaceType];
                const status = item.status;
                const canQuickOpen = Boolean(
                  projectUuid &&
                    status?.status === 'ready' &&
                    status.workspaceUuid
                );

                return (
                  <div
                    key={workspaceType}
                    style={{
                      display: 'grid',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                      background:
                        'linear-gradient(180deg, rgba(15, 23, 42, 0.42), rgba(2, 6, 23, 0.22))',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <strong style={{ fontSize: 12 }}>
                        {getWorkspaceLabel(workspaceType)}
                      </strong>

                      <span
                        className={getWorkspaceStatusClassName(
                          status,
                          item.isLoading
                        )}
                      >
                        {getWorkspaceStatusText(status, item.isLoading)}
                      </span>
                    </div>

                    <span
                      style={{
                        color: 'var(--text-muted, rgba(203, 213, 225, 0.72))',
                        fontSize: 11,
                        lineHeight: 1.7,
                      }}
                    >
                      {getWorkspaceDescription(
                        workspaceType,
                        status,
                        item.isLoading
                      )}
                    </span>

                    {status?.workspaceUuid ? (
                      <code className={styles.femModelUuid}>
                        {status.workspaceUuid}
                      </code>
                    ) : null}

                    {canQuickOpen ? (
                      <button
                        type="button"
                        className={styles.femWorkspaceBtn}
                        onClick={() => handleQuickOpenWorkspace(workspaceType)}
                        disabled={isBusy}
                      >
                        ورود به {getWorkspacePersianLabel(workspaceType)}
                        <span
                          style={{
                            marginRight: '8px',
                            fontSize: '0.9em',
                            opacity: 0.8,
                          }}
                        >
                          ↗
                        </span>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.femWorkspaceBtn}
              onClick={handleOpenWorkspaceManager}
              disabled={!selectedEntity || isBusy}
              style={{ marginTop: 12 }}
            >
              مدیریت Workspaceها
            </button>
          </div>

          <div className={styles.uuidBox}>
            <span className={styles.propertyLabel}>UUID</span>
            <code>{selectedEntity.uuid}</code>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.name}</label>
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className={getInputClassName('name')}
              placeholder="نام سیستم"
              disabled={isBusy}
            />
            {nameError ? (
              <span className={styles.fieldError}>{nameError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.code}</label>
            <input
              type="text"
              value={editCode}
              onChange={(event) => setEditCode(event.target.value)}
              className={getInputClassName('code')}
              placeholder="کد اختیاری"
              disabled={isBusy}
            />
            {codeError ? (
              <span className={styles.fieldError}>{codeError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.description}
            </label>
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              className={getTextareaClassName('description')}
              placeholder="توضیحات اختیاری..."
              disabled={isBusy}
            />
            {descriptionError ? (
              <span className={styles.fieldError}>{descriptionError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.entity_type}
            </label>
            <select
              value={editType}
              onChange={(event) => setEditType(event.target.value as EntityType)}
              className={getInputClassName('entity_type')}
              disabled={isBusy}
            >
              {ENTITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.system_type_uuid}
            </label>
            <select
              value={systemTypeUuid ?? ''}
              onChange={(event) => setSystemTypeUuid(event.target.value || null)}
              className={getInputClassName('system_type_uuid')}
              disabled={isBusy}
            >
              <option value="">بدون تیپ خاص</option>
              {systemEntityTypes.map((type: any) => (
                <option key={type.uuid} value={type.uuid}>
                  {type.name} {type.code ? `(${type.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.coordinateSection}>
            <span className={styles.sectionTitle}>مختصات فضایی</span>

            <div className={styles.coordinatesGrid}>
              <div className={styles.coordInputGroup}>
                <label>X</label>
                <input
                  type="number"
                  step="0.5"
                  value={posX}
                  onChange={(event) =>
                    setPosX(toFiniteNumber(event.target.value))
                  }
                  className={getInputClassName('pos_x')}
                  disabled={isBusy}
                />
              </div>

              <div className={styles.coordInputGroup}>
                <label>Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={posY}
                  onChange={(event) =>
                    setPosY(toFiniteNumber(event.target.value))
                  }
                  className={getInputClassName('pos_y')}
                  disabled={isBusy}
                />
              </div>

              <div className={styles.coordInputGroup}>
                <label>Z</label>
                <input
                  type="number"
                  step="0.5"
                  value={posZ}
                  onChange={(event) =>
                    setPosZ(toFiniteNumber(event.target.value))
                  }
                  className={getInputClassName('pos_z')}
                  disabled={isBusy}
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>Metadata</label>

            {Object.keys(currentMetadataSchema).length === 0 ? (
              <pre className={styles.metadataBox}>
                {JSON.stringify(selectedEntity.metadata ?? {}, null, 2)}
              </pre>
            ) : (
              <div className={styles.metadataFormWrapper}>
                <MetadataForm
                  key={systemTypeUuid ?? 'no-type'}
                  schema={currentMetadataSchema}
                  values={metadataValues}
                  onChange={setMetadataValues}
                  disabled={isBusy}
                />
              </div>
            )}
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className={styles.applyBtn}
            >
              {isUpdating ? 'در حال همگام‌سازی...' : 'اعمال تغییرات'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className={styles.deleteBtn}
            >
              {isDeleting ? 'در حال حذف...' : 'حذف موجودیت'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
