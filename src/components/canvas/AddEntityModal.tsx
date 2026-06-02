// src/components/canvas/AddEntityModal.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { useCreateSystemEntity } from '@/hooks/useCreateSystemEntity';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useSystemEntityTypes } from '@/hooks/useSystemEntityTypes';
import MetadataForm from '@/components/metadata/MetadataForm';

import type { SystemEntityType } from '@/lib/api/types';
import type { MetadataSchema, MetadataValues } from '@/lib/metadata/types';

import {
  buildMetadataOverrides,
  ensureMetadataConfig,
  getMetadataInitialValues,
  sanitizeMetadataForSubmit,
} from '@/lib/metadata/utils';

import styles from './AddEntityModal.module.css';

type AddEntityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectUuid: string;
  scenarioId?: string;
  initialParent?: string | null;
  initialPosition?: {
    x: number;
    y: number;
    z?: number;
  } | null;
};

type ExistingCanvasEntity = {
  uuid: string;
  name?: string;
  code?: string;
  systemType?: {
    uuid?: string;
    code?: string;
    name?: string;
    allows_children?: boolean;
    allowsChildren?: boolean;
  } | null;
  system_type?: {
    uuid?: string;
    code?: string;
    name?: string;
    allows_children?: boolean;
    allowsChildren?: boolean;
  } | null;
  allows_children?: boolean;
  allowsChildren?: boolean;
  isActive?: boolean;
  is_active?: boolean;
};

function parseNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function getBackendErrorMessage(error: any): string {
  const backendError =
    error?.response?.data ??
    error?.data ??
    error?.message ??
    null;

  if (!backendError) {
    return 'خطا در ایجاد سیستم.';
  }

  if (typeof backendError === 'string') {
    return backendError;
  }

  if (Array.isArray(backendError)) {
    return backendError.map(String).join(' | ');
  }

  if (typeof backendError === 'object') {
    const detail = backendError.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    const message = Object.entries(backendError)
      .map(([field, msgs]) => {
        if (Array.isArray(msgs)) {
          return `${field}: ${msgs.join('، ')}`;
        }

        if (msgs && typeof msgs === 'object') {
          return `${field}: ${JSON.stringify(msgs)}`;
        }

        return `${field}: ${String(msgs)}`;
      })
      .join(' | ');

    return message || 'خطا در ایجاد سیستم.';
  }

  return 'خطا در ایجاد سیستم.';
}

function getEntityDisplayName(entity: ExistingCanvasEntity): string {
  const name = entity.name?.trim() || 'Untitled';
  const code = entity.code?.trim();

  return code ? `${name} (${code})` : name;
}

function getEntitySystemType(entity: ExistingCanvasEntity) {
  return entity.systemType ?? entity.system_type ?? null;
}

function getEntityAllowsChildren(entity: ExistingCanvasEntity): boolean {
  const direct =
    entity.allows_children ??
    entity.allowsChildren;

  if (typeof direct === 'boolean') {
    return direct;
  }

  const systemType = getEntitySystemType(entity);

  const fromType =
    systemType?.allows_children ??
    systemType?.allowsChildren;

  if (typeof fromType === 'boolean') {
    return fromType;
  }

  /**
   * Backward-compatible fallback:
   * اگر دیتای canvas هنوز allows_children را ندارد،
   * اجازه می‌دهیم parent انتخاب شود و validation اصلی با backend باشد.
   */
  return true;
}

function getSystemTypeAllowsChildren(type: SystemEntityType | null): boolean {
  if (!type) return true;

  const value =
    (type as any).allows_children ??
    (type as any).allowsChildren;

  if (typeof value === 'boolean') return value;

  return true;
}

function getSystemTypeIsRootAllowed(type: SystemEntityType): boolean {
  const value =
    (type as any).is_root_allowed ??
    (type as any).isRootAllowed;

  if (typeof value === 'boolean') return value;

  return false;
}

function getSystemTypeLabel(type: SystemEntityType): string {
  const name = (type as any).name ?? 'Unnamed Type';
  const code = (type as any).code;

  return code ? `${name} (${code})` : name;
}

export default function AddEntityModal({
  isOpen,
  onClose,
  projectUuid,
  scenarioId,
  initialParent = null,
  initialPosition = null,
}: AddEntityModalProps) {
  const { mutateAsync: createSystemEntity, isPending } =
    useCreateSystemEntity(projectUuid, scenarioId);

  const existingEntities = useCanvasStore((state) => state.entities);

  const {
    data: entityTypes,
    isLoading: isTypesLoading,
  } = useSystemEntityTypes();

  const normalizedEntityTypes = useMemo<SystemEntityType[]>(() => {
    return Array.isArray(entityTypes) ? entityTypes : [];
  }, [entityTypes]);

  const normalizedExistingEntities = useMemo<ExistingCanvasEntity[]>(() => {
    return Array.isArray(existingEntities)
      ? (existingEntities as ExistingCanvasEntity[])
      : [];
  }, [existingEntities]);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [parent, setParent] = useState(initialParent ?? '');
  const [systemTypeUuid, setSystemTypeUuid] = useState('');

  const [x, setX] = useState<string>(
    initialPosition ? String(initialPosition.x) : '0'
  );

  const [y, setY] = useState<string>(
    initialPosition ? String(initialPosition.y) : '0'
  );

  const [z, setZ] = useState<string>(
    initialPosition?.z !== undefined ? String(initialPosition.z) : '0'
  );

  const [metadataValues, setMetadataValues] = useState<MetadataValues>({});
  const [error, setError] = useState<string | null>(null);

  const selectedParent = useMemo(() => {
    if (!parent.trim()) return null;

    return (
      normalizedExistingEntities.find(
        (entity) => entity.uuid === parent.trim()
      ) ?? null
    );
  }, [normalizedExistingEntities, parent]);

  const selectedParentAllowsChildren = useMemo(() => {
    if (!selectedParent) return true;
    return getEntityAllowsChildren(selectedParent);
  }, [selectedParent]);

  const availableParents = useMemo(() => {
    return normalizedExistingEntities.filter((entity) => {
      if (!entity?.uuid) return false;

      /**
       * اگر entity غیرفعال است، بهتر است در لیست parent نیاید.
       * اگر این فیلد وجود ندارد، backward-compatible رفتار می‌کنیم.
       */
      const isActive =
        entity.isActive ??
        entity.is_active;

      if (typeof isActive === 'boolean' && !isActive) {
        return false;
      }

      /**
       * Parentهایی که اجازه child ندارند را از لیست حذف نمی‌کنیم،
       * چون ممکن است کاربر بخواهد وضعیت را ببیند.
       * اما بعداً type selection و submit را کنترل می‌کنیم.
       */
      return true;
    });
  }, [normalizedExistingEntities]);

  /**
   * ارتباط اصلی Parent -> Type:
   *
   * - اگر parent نداریم یعنی entity جدید root است.
   *   پس فقط typeهایی مجازند که is_root_allowed=true دارند.
   *
   * - اگر parent داریم یعنی entity جدید child است.
   *   پس root restriction دیگر اعمال نمی‌شود.
   *
   * نکته:
   * در این مرحله constraint تخصصی parent-child type نداریم،
   * چون مدل فعلی relationship matrix ندارد.
   * validation نهایی با backend است.
   */
  const availableTypes = useMemo(() => {
    if (isTypesLoading) return [];

    if (!normalizedEntityTypes.length) return [];

    if (!parent.trim()) {
      return normalizedEntityTypes.filter((type) =>
        getSystemTypeIsRootAllowed(type)
      );
    }

    if (!selectedParentAllowsChildren) {
      return [];
    }

    return normalizedEntityTypes;
  }, [
    isTypesLoading,
    normalizedEntityTypes,
    parent,
    selectedParentAllowsChildren,
  ]);

  const selectedType = useMemo(() => {
    if (!systemTypeUuid.trim()) return null;

    return (
      normalizedEntityTypes.find((type) => type.uuid === systemTypeUuid) ??
      null
    );
  }, [normalizedEntityTypes, systemTypeUuid]);

  const selectedTypeExistsInAvailableTypes = useMemo(() => {
    if (!systemTypeUuid.trim()) return false;

    return availableTypes.some((type) => type.uuid === systemTypeUuid);
  }, [availableTypes, systemTypeUuid]);

  const metadataConfig = useMemo(() => {
    if (!selectedType) {
      return { schema: {}, defaults: {} };
    }

    const explicitSchema = (selectedType as any).metadata_schema;
    const explicitDefaults = (selectedType as any).metadata_defaults;

    if (explicitSchema || explicitDefaults) {
      return {
        schema: explicitSchema ?? {},
        defaults: explicitDefaults ?? {},
      };
    }

    return ensureMetadataConfig((selectedType as any).metadata);
  }, [selectedType]);

  const currentMetadataSchema = metadataConfig.schema as MetadataSchema;
  const currentMetadataDefaults = metadataConfig.defaults as MetadataValues;

  const hasMetadataSchema = useMemo(() => {
    return Object.keys(currentMetadataSchema ?? {}).length > 0;
  }, [currentMetadataSchema]);

  const parentHint = useMemo(() => {
    if (!parent.trim()) {
      return 'بدون والد یعنی این سیستم به‌عنوان Root ساخته می‌شود؛ بنابراین فقط Typeهای مجاز برای Root نمایش داده می‌شوند.';
    }

    if (!selectedParent) {
      return 'والد انتخاب‌شده در لیست موجودیت‌های فعلی پیدا نشد.';
    }

    if (!selectedParentAllowsChildren) {
      return 'والد انتخاب‌شده اجازه داشتن فرزند ندارد؛ لطفاً والد دیگری انتخاب کنید یا بدون والد بسازید.';
    }

    return `سیستم جدید به‌عنوان فرزند «${getEntityDisplayName(
      selectedParent
    )}» ساخته می‌شود.`;
  }, [parent, selectedParent, selectedParentAllowsChildren]);

  const typeHint = useMemo(() => {
    if (isTypesLoading) {
      return 'در حال دریافت Typeهای سیستم...';
    }

    if (!normalizedEntityTypes.length) {
      return 'هیچ نوع موجودیتی در سیستم تعریف نشده است.';
    }

    if (!parent.trim()) {
      if (!availableTypes.length) {
        return 'برای ساخت Root، هیچ Type مجازی با is_root_allowed=true پیدا نشد.';
      }

      return 'چون والد انتخاب نشده، فقط Typeهایی نمایش داده می‌شوند که اجازه Root شدن دارند.';
    }

    if (!selectedParentAllowsChildren) {
      return 'ابتدا یک والد معتبر که اجازه child دارد انتخاب کنید.';
    }

    if (!availableTypes.length) {
      return 'برای والد انتخاب‌شده هیچ Type مجازی پیدا نشد.';
    }

    return 'چون والد انتخاب شده، سیستم جدید به‌عنوان Child ساخته می‌شود و محدودیت Root اعمال نمی‌شود.';
  }, [
    isTypesLoading,
    normalizedEntityTypes.length,
    parent,
    availableTypes.length,
    selectedParentAllowsChildren,
  ]);

  /**
   * Reset فرم هنگام باز شدن modal
   */
  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setCode('');
    setDescription('');

    setParent(initialParent ?? '');

    setX(initialPosition ? String(initialPosition.x) : '0');
    setY(initialPosition ? String(initialPosition.y) : '0');
    setZ(initialPosition?.z !== undefined ? String(initialPosition.z) : '0');

    setSystemTypeUuid('');
    setMetadataValues({});
    setError(null);
  }, [isOpen, initialParent, initialPosition]);

  /**
   * وقتی parent یا لیست typeها تغییر کرد،
   * type فعلی را با availableTypes هماهنگ می‌کنیم.
   */
  useEffect(() => {
    if (!isOpen) return;

    if (isTypesLoading) return;

    if (availableTypes.length === 0) {
      setSystemTypeUuid('');
      return;
    }

    if (!systemTypeUuid.trim()) {
      setSystemTypeUuid(availableTypes[0].uuid);
      return;
    }

    if (!selectedTypeExistsInAvailableTypes) {
      setSystemTypeUuid(availableTypes[0].uuid);
    }
  }, [
    isOpen,
    isTypesLoading,
    availableTypes,
    systemTypeUuid,
    selectedTypeExistsInAvailableTypes,
  ]);

  /**
   * وقتی type عوض می‌شود، metadata form باید از defaults همان type ساخته شود.
   */
  useEffect(() => {
    if (!isOpen) return;

    const initialMetadata = getMetadataInitialValues({
      schema: currentMetadataSchema,
      defaults: currentMetadataDefaults,
      values: {},
    });

    setMetadataValues(initialMetadata);
  }, [
    isOpen,
    systemTypeUuid,
    currentMetadataSchema,
    currentMetadataDefaults,
  ]);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      code.trim().length > 0 &&
      systemTypeUuid.trim().length > 0 &&
      selectedParentAllowsChildren
    );
  }, [
    name,
    code,
    systemTypeUuid,
    selectedParentAllowsChildren,
  ]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleParentChange = (nextParent: string) => {
    setParent(nextParent);
    setError(null);

    /**
     * اینجا عمداً systemTypeUuid را مستقیم reset نمی‌کنیم،
     * چون useEffect بالا تصمیم می‌گیرد type فعلی هنوز معتبر هست یا نه.
     * این باعث می‌شود اگر child/root تغییر کند و type هنوز valid باشد،
     * تجربه کاربری نرم‌تر شود.
     */
  };

  const handleSystemTypeChange = (nextSystemTypeUuid: string) => {
    setSystemTypeUuid(nextSystemTypeUuid);
    setError(null);
  };

  const handleSubmit = async () => {
    if (isPending) return;

    if (!projectUuid) {
      setError('شناسه پروژه معتبر نیست.');
      return;
    }

    if (!name.trim() || !code.trim()) {
      setError('نام سیستم و کد الزامی است.');
      return;
    }

    if (!systemTypeUuid.trim()) {
      setError('انتخاب نوع موجودیت الزامی است.');
      return;
    }

    if (parent.trim() && !selectedParent) {
      setError('والد انتخاب‌شده معتبر نیست.');
      return;
    }

    if (parent.trim() && !selectedParentAllowsChildren) {
      setError('والد انتخاب‌شده اجازه داشتن فرزند ندارد.');
      return;
    }

    if (!selectedType) {
      setError('نوع موجودیت انتخاب‌شده معتبر نیست.');
      return;
    }

    /**
     * اگر parent نداریم، یعنی سیستم root ساخته می‌شود.
     * پس frontend-side هم root_allowed را کنترل می‌کنیم.
     * validation اصلی همچنان backend است.
     */
    if (!parent.trim() && !getSystemTypeIsRootAllowed(selectedType)) {
      setError('این نوع موجودیت اجازه ساخته شدن به‌عنوان Root را ندارد.');
      return;
    }

    const parsedX = parseNumberOrNull(x);
    const parsedY = parseNumberOrNull(y);
    const parsedZ = parseNumberOrNull(z);

    if (parsedX === null || parsedY === null || parsedZ === null) {
      setError('مختصات X و Y و Z باید عدد معتبر باشند.');
      return;
    }

    setError(null);

    const cleanedMetadata = sanitizeMetadataForSubmit(
      currentMetadataSchema,
      metadataValues
    );

    /**
     * فقط overrideها ذخیره می‌شوند.
     * defaults از SystemEntityType می‌آیند.
     */
    const metadataPayload = buildMetadataOverrides(
      currentMetadataDefaults,
      cleanedMetadata
    );

    const payload = {
      project: projectUuid,
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,

      system_type_uuid: systemTypeUuid,

      pos_x: parsedX,
      pos_y: parsedY,
      pos_z: parsedZ,

      metadata: metadataPayload,

      ...(parent.trim() ? { parent: parent.trim() } : {}),
    };

    try {
      await createSystemEntity(payload);
      onClose();
    } catch (e: any) {
      setError(getBackendErrorMessage(e));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="افزودن سیستم جدید"
      size="md"
    >
      <div
        className={styles.container}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className={styles.formGroup}>
          <label className={styles.label}>نام سیستم</label>

          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="مثلاً Box Culvert"
            className={styles.input}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>کد</label>

          <input
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
            }}
            placeholder="مثلاً BX-001"
            className={styles.input}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>والد</label>

          <select
            value={parent}
            onChange={(event) => handleParentChange(event.target.value)}
            disabled={isPending}
            className={styles.select}
          >
            <option value="">-- بدون والد / ساخت به‌عنوان Root --</option>

            {availableParents.map((entity) => {
              const allowsChildren = getEntityAllowsChildren(entity);

              return (
                <option key={entity.uuid} value={entity.uuid}>
                  {getEntityDisplayName(entity)}
                  {!allowsChildren ? ' - بدون اجازه فرزند' : ''}
                </option>
              );
            })}
          </select>

          <span className={styles.hint}>
            {parentHint}
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>نوع موجودیت</label>

          <select
            value={systemTypeUuid}
            onChange={(event) =>
              handleSystemTypeChange(event.target.value)
            }
            className={styles.select}
            disabled={
              isPending ||
              isTypesLoading ||
              availableTypes.length === 0 ||
              !selectedParentAllowsChildren
            }
          >
            {isTypesLoading ? (
              <option value="">در حال دریافت اطلاعات...</option>
            ) : availableTypes.length === 0 ? (
              <option value="">نوع سیستم مجاز وجود ندارد</option>
            ) : (
              availableTypes.map((type) => {
                const allowsChildren = getSystemTypeAllowsChildren(type);

                return (
                  <option key={type.uuid} value={type.uuid}>
                    {getSystemTypeLabel(type)}
                    {!parent.trim() ? ' - Root Allowed' : ''}
                    {!allowsChildren ? ' - Leaf Type' : ''}
                  </option>
                );
              })
            )}
          </select>

          <span className={styles.hint}>
            {typeHint}
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>توضیحات</label>

          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setError(null);
            }}
            placeholder="توضیحات اختیاری..."
            rows={3}
            className={styles.textarea}
            disabled={isPending}
          />
        </div>

        <div className={styles.grid3}>
          <div className={styles.formGroup}>
            <label className={styles.label}>مختصات X</label>

            <input
              type="number"
              value={x}
              onChange={(event) => {
                setX(event.target.value);
                setError(null);
              }}
              className={styles.input}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>مختصات Y</label>

            <input
              type="number"
              value={y}
              onChange={(event) => {
                setY(event.target.value);
                setError(null);
              }}
              className={styles.input}
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>مختصات Z</label>

            <input
              type="number"
              value={z}
              onChange={(event) => {
                setZ(event.target.value);
                setError(null);
              }}
              className={styles.input}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>مشخصات مهندسی</label>

          <div className={styles.metadataBlock}>
            {systemTypeUuid ? (
              <MetadataForm
                key={systemTypeUuid || 'no-system-type'}
                schema={currentMetadataSchema}
                values={metadataValues}
                onChange={setMetadataValues}
                disabled={isPending}
                title="Engineering Metadata"
                emptyMessage="برای این نوع سیستم، schema متادیتا تعریف نشده است."
              />
            ) : (
              <div className={styles.emptyMetadata}>
                ابتدا نوع موجودیت را انتخاب کنید تا فرم مشخصات مهندسی نمایش داده
                شود.
              </div>
            )}

            {systemTypeUuid && !hasMetadataSchema ? (
              <div className={styles.metadataHint}>
                برای Type انتخاب‌شده schema متادیتا تعریف نشده است؛ بنابراین
                metadata خالی ارسال می‌شود.
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className={styles.errorBox}>
            {error}
          </div>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className={styles.cancelBtn}
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !isValid ||
              isPending ||
              isTypesLoading ||
              availableTypes.length === 0 ||
              !selectedParentAllowsChildren
            }
            className={styles.submitBtn}
          >
            {isPending ? 'در حال ایجاد...' : 'ایجاد سیستم'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
