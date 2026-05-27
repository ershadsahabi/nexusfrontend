// src/components/layout/PropertiesPanel.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteSystemEntity } from '@/hooks/useDeleteSystemEntity';
import { useSystemEntityTypes } from '@/hooks/useSystemEntityTypes';

import type { ApiEntityType } from '@/lib/types/api.types';

import {
  type ApiErrorMap,
  buildSystemEntityErrorSummary,
  FIELD_LABELS,
  getFirstSystemEntityFieldError,
  hasSystemEntityFieldError,
  parseSystemErrors,
  type UpdateSystemEntityPayload,
} from '@/lib/api/system';

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

function toNullableString(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
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

  const {
    selectedEntity: selectedEntityId,
    entities,
    removeEntity,
    clearSelection,
  } = useCanvasStore();

  const selectedEntity = entities.find(
    (entity) => entity.uuid === selectedEntityId
  );

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

  const [saveError, setSaveError] = useState<ApiErrorMap | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentSystemType = useMemo(() => {
    return selectedEntity?.systemType ?? null;
  }, [selectedEntity]);

  const generalSaveErrors = useMemo(() => {
    if (!saveError) return [];

    return saveError.nonFieldErrors ?? [];
  }, [saveError]);

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
    if (!selectedEntity) return;

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
    setDeleteError(null);

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
    };

    try {
      await updateEntityMutation.mutateAsync({
        entityUuid: selectedEntity.uuid,
        payload,
      });

      setSaveError(null);
    } catch (error) {
      const parsed = parseSystemErrors(error);

      setSaveError(parsed);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntity) return;

    if (!selectedEntity.uuid) {
      setDeleteError('شناسه موجودیت انتخاب‌شده معتبر نیست.');
      return;
    }

    if (!projectUuid) {
      setDeleteError('شناسه پروژه از مسیر صفحه پیدا نشد.');
      return;
    }

    const confirmed = window.confirm(
      `آیا از حذف موجودیت «${
        selectedEntity.name ?? selectedEntity.uuid
      }» مطمئن هستید؟`
    );

    if (!confirmed) return;

    setDeleteError(null);
    setSaveError(null);

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
        <div>
          <span className={styles.panelEyebrow}>Inspector</span>
          <h3 className={styles.panelTitle}>مشخصات سیستم</h3>
        </div>

        {selectedEntity ? (
          <span className={styles.panelStateActive}>انتخاب شده</span>
        ) : (
          <span className={styles.panelStateIdle}>بدون انتخاب</span>
        )}
      </div>

      {!selectedEntity ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <p>یک سیستم را روی بوم انتخاب کنید.</p>
          <span>
            مشخصات، مختصات و نوع المان در این بخش نمایش داده می‌شود.
          </span>
        </div>
      ) : (
        <div className={styles.propertiesForm}>
          {generalSaveErrors.length > 0 ? (
            <div className={styles.errorBox}>
              {generalSaveErrors.map((message, index) => (
                <div key={`${message}-${index}`}>{message}</div>
              ))}
            </div>
          ) : null}

          {deleteError ? (
            <div className={styles.errorBox}>{deleteError}</div>
          ) : null}

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
              onChange={(e) => setEditCode(e.target.value)}
              className={getInputClassName('code')}
              placeholder="کد اختیاری"
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
              onChange={(e) => setEditDescription(e.target.value)}
              className={getTextareaClassName('description')}
              placeholder="توضیحات اختیاری..."
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
              onChange={(e) => setEditType(e.target.value as EntityType)}
              className={getInputClassName('entity_type')}
            >
              {ENTITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {entityTypeError ? (
              <span className={styles.fieldError}>{entityTypeError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.system_type_uuid}
            </label>

            <select
              value={systemTypeUuid ?? ''}
              onChange={(e) => setSystemTypeUuid(e.target.value || null)}
              className={getInputClassName('system_type_uuid')}
            >
              <option value="">بدون تیپ خاص</option>

              {systemEntityTypes.map((type) => (
                <option key={type.uuid} value={type.uuid}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>

            {currentSystemType ? (
              <span className={styles.fieldHint}>
                تیپ فعلی: {currentSystemType.name} ({currentSystemType.code})
              </span>
            ) : null}

            {systemTypeUuidError ? (
              <span className={styles.fieldError}>{systemTypeUuidError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.parent}
            </label>

            <input
              type="text"
              value={parentUuid ?? ''}
              onChange={(e) => setParentUuid(toNullableString(e.target.value))}
              className={getInputClassName('parent')}
              placeholder="اختیاری - UUID والد"
            />

            {parentError ? (
              <span className={styles.fieldError}>{parentError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.sort_order}
            </label>

            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(toFiniteNumber(e.target.value, 0))}
              className={getInputClassName('sort_order')}
            />

            {sortOrderError ? (
              <span className={styles.fieldError}>{sortOrderError}</span>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              {FIELD_LABELS.is_active}
            </label>

            <div className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />

              <span className={styles.fieldHint}>
                اگر غیرفعال باشد، ممکن است در برخی نماها نمایش داده نشود.
              </span>
            </div>

            {isActiveError ? (
              <span className={styles.fieldError}>{isActiveError}</span>
            ) : null}
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.coordinateSection}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionTitle}>مختصات فضایی</span>
              <span className={styles.sectionHint}>X / Y / Z</span>
            </div>

            <div className={styles.coordinatesGrid}>
              <div className={styles.coordInputGroup}>
                <label>X</label>

                <input
                  type="number"
                  step="0.5"
                  value={posX}
                  onChange={(e) => setPosX(toFiniteNumber(e.target.value, 0))}
                  className={getInputClassName('pos_x')}
                />

                {posXError ? (
                  <span className={styles.fieldError}>{posXError}</span>
                ) : null}
              </div>

              <div className={styles.coordInputGroup}>
                <label>Y</label>

                <input
                  type="number"
                  step="0.5"
                  value={posY}
                  onChange={(e) => setPosY(toFiniteNumber(e.target.value, 0))}
                  className={getInputClassName('pos_y')}
                />

                {posYError ? (
                  <span className={styles.fieldError}>{posYError}</span>
                ) : null}
              </div>

              <div className={styles.coordInputGroup}>
                <label>Z</label>

                <input
                  type="number"
                  step="0.5"
                  value={posZ}
                  onChange={(e) => setPosZ(toFiniteNumber(e.target.value, 0))}
                  className={getInputClassName('pos_z')}
                />

                {posZError ? (
                  <span className={styles.fieldError}>{posZError}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.formGroupInline}>
            <div>
              <label className={styles.propertyLabel}>Root?</label>
              <span>{selectedEntity.isRoot ? 'بله' : 'خیر'}</span>
            </div>

            <div>
              <label className={styles.propertyLabel}>Leaf?</label>
              <span>{selectedEntity.isLeaf ? 'بله' : 'خیر'}</span>
            </div>
          </div>

          {selectedEntity.metadata &&
          Object.keys(selectedEntity.metadata).length > 0 ? (
            <div className={styles.formGroup}>
              <label className={styles.propertyLabel}>Metadata</label>

              <pre className={styles.metadataBox}>
                {JSON.stringify(selectedEntity.metadata, null, 2)}
              </pre>
            </div>
          ) : null}

          {selectedEntity.createdAt || selectedEntity.updatedAt ? (
            <div className={styles.formGroup}>
              <label className={styles.propertyLabel}>تاریخ‌ها</label>

              <div className={styles.timestamps}>
                {selectedEntity.createdAt ? (
                  <div>
                    <span>ایجاد:</span>
                    <code>{selectedEntity.createdAt}</code>
                  </div>
                ) : null}

                {selectedEntity.updatedAt ? (
                  <div>
                    <span>آخرین به‌روزرسانی:</span>
                    <code>{selectedEntity.updatedAt}</code>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateEntityMutation.isPending || !projectUuid}
              className={styles.applyBtn}
            >
              {updateEntityMutation.isPending
                ? 'در حال همگام‌سازی...'
                : 'اعمال تغییرات'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteEntityMutation.isPending || !projectUuid}
              className={styles.deleteBtn}
            >
              {deleteEntityMutation.isPending
                ? 'در حال حذف...'
                : 'حذف موجودیت'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
