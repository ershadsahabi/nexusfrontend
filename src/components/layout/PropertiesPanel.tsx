// src/components/layout/PropertiesPanel.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteSystemEntity } from '@/hooks/useDeleteSystemEntity';
import { useSystemEntityTypes } from '@/hooks/useSystemEntityTypes';
import { useFemStatus } from '@/hooks/useFemModel';
import { useFemStatusStore } from '@/store/useFemStatusStore';

import type { ApiEntityType } from '@/lib/types/api.types';
import type { MetadataSchema, MetadataValues } from '@/lib/metadata/types';

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

function buildFemWorkspaceHref(projectUuid: string, femModelUuid: string) {
  return `/projects/${projectUuid}/fem/${femModelUuid}`;
}

export const PropertiesPanel = () => {
  const params = useParams();
  const router = useRouter();

  const projectUuid =
    typeof params?.projectId === 'string'
      ? params.projectId
      : typeof params?.id === 'string'
        ? params.id
        : '';

  const scenarioId =
    typeof params?.scenarioId === 'string' ? params.scenarioId : undefined;

  const {
    selectedEntity: selectedEntityId,
    entities,
    removeEntity,
    clearSelection,
    updateEntityInStore,
  } = useCanvasStore();

  const selectedEntity = entities.find(
    (entity) => entity.uuid === selectedEntityId
  );

  // --- FEM Status & Integration ---
  const cachedFemStatus = useFemStatusStore((state) =>
    selectedEntity?.uuid ? state.byEntityUuid[selectedEntity.uuid] ?? null : null
  );

  const { data: fetchedFemStatus, isLoading: isFemStatusLoading } = useFemStatus(
    projectUuid,
    selectedEntity?.uuid ?? null
  );

  const femStatus = fetchedFemStatus ?? cachedFemStatus ?? null;

  const isFemEligible =
    femStatus?.femEligible ??
    (selectedEntity?.systemType as any)?.fem_eligible ??
    false;

  const canOpenFemWorkspace = Boolean(
    projectUuid && femStatus?.hasFemModel && femStatus?.femModelUuid
  );

  const handleOpenFemWorkspace = () => {
    if (!projectUuid || !femStatus?.femModelUuid) return;
    router.push(buildFemWorkspaceHref(projectUuid, femStatus.femModelUuid));
  };
  // --------------------------------

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
    return systemEntityTypes.find((t: any) => t.uuid === systemTypeUuid) ?? null;
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

  const availableParents = useMemo(() => {
    if (!selectedEntity) return [];

    return entities.filter((entity) => {
      if (!entity?.uuid) return false;
      if (entity.uuid === selectedEntity.uuid) return false;
      return true;
    });
  }, [entities, selectedEntity]);

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
  const entityTypeError = getFirstSystemEntityFieldError(
    saveError,
    'entity_type'
  );
  const systemTypeUuidError = getFirstSystemEntityFieldError(
    saveError,
    'system_type_uuid'
  );
  const parentError = getFirstSystemEntityFieldError(saveError, 'parent');
  const sortOrderError = getFirstSystemEntityFieldError(
    saveError,
    'sort_order'
  );
  const isActiveError = getFirstSystemEntityFieldError(saveError, 'is_active');
  const posXError = getFirstSystemEntityFieldError(saveError, 'pos_x');
  const posYError = getFirstSystemEntityFieldError(saveError, 'pos_y');
  const posZError = getFirstSystemEntityFieldError(saveError, 'pos_z');
  const metadataError = getFirstSystemEntityFieldError(saveError, 'metadata');

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

      if (updateEntityInStore) {
        updateEntityInStore(selectedEntity.uuid, {
          ...selectedEntity,
          ...updated,
        });
      }
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

          {/* --- FEM Workspace Integration Card --- */}
          <div className={styles.femWorkspaceCard}>
            <div className={styles.femWorkspaceHeader}>
              <div>
                <span className={styles.femWorkspaceEyebrow}>FEM WORKSPACE</span>
                <strong>فضای تحلیل مهندسی</strong>
              </div>

              {isFemStatusLoading ? (
                <span className={styles.femStatusPillMuted}>در حال بررسی...</span>
              ) : femStatus?.hasFemModel ? (
                <span className={styles.femStatusPillSuccess}>متصل</span>
              ) : isFemEligible ? (
                <span className={styles.femStatusPillWarning}>آماده اتصال</span>
              ) : (
                <span className={styles.femStatusPillMuted}>غیرمجاز</span>
              )}
            </div>

            <p className={styles.femWorkspaceText}>
              {isFemStatusLoading
                ? 'در حال دریافت وضعیت مدل FEM برای این موجودیت...'
                : femStatus?.hasFemModel
                ? 'مدل FEM برای این موجودیت ساخته شده است و می‌توانید وارد فضای تحلیل شوید.'
                : isFemEligible
                ? 'این موجودیت قابلیت FEM دارد، اما هنوز مدل FEM برای آن ساخته نشده است.'
                : 'این موجودیت قابلیت اتصال به FEM Workspace را ندارد.'}
            </p>

            {femStatus?.femModelUuid && (
              <code className={styles.femModelUuid}>{femStatus.femModelUuid}</code>
            )}

            <button
              type="button"
              className={styles.femWorkspaceBtn}
              onClick={handleOpenFemWorkspace}
              disabled={!canOpenFemWorkspace || isBusy}
            >
              ورود به فضای FEM
            </button>
          </div>
          {/* -------------------------------------- */}

          <div className={styles.uuidBox}>
            <span className={styles.propertyLabel}>UUID</span>
            <code>{selectedEntity.uuid}</code>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.name}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={getInputClassName('name')}
              placeholder="نام سیستم"
              disabled={isBusy}
            />
            {nameError && <span className={styles.fieldError}>{nameError}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.code}</label>
            <input
              type="text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className={getInputClassName('code')}
              placeholder="کد اختیاری"
              disabled={isBusy}
            />
            {codeError && <span className={styles.fieldError}>{codeError}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.description}</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className={getTextareaClassName('description')}
              placeholder="توضیحات اختیاری..."
              disabled={isBusy}
            />
            {descriptionError && <span className={styles.fieldError}>{descriptionError}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.entity_type}</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as EntityType)}
              className={getInputClassName('entity_type')}
              disabled={isBusy}
            >
              {ENTITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>{FIELD_LABELS.system_type_uuid}</label>
            <select
              value={systemTypeUuid ?? ''}
              onChange={(e) => setSystemTypeUuid(e.target.value || null)}
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
                  onChange={(e) => setPosX(toFiniteNumber(e.target.value))}
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
                  onChange={(e) => setPosY(toFiniteNumber(e.target.value))}
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
                  onChange={(e) => setPosZ(toFiniteNumber(e.target.value))}
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
