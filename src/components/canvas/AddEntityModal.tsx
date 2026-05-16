// src/components/canvas/AddEntityModal.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { useCreateSystemEntity } from '@/hooks/useCreateSystemEntity';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useSystemEntityTypes } from '@/hooks/useSystemEntityTypes';
import type { SystemEntityType } from '@/lib/api/types';

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

export default function AddEntityModal({
  isOpen,
  onClose,
  projectUuid,
  scenarioId,
  initialParent = null,
  initialPosition = null,
}: AddEntityModalProps) {
  const { mutateAsync: createSystemEntity, isPending } = useCreateSystemEntity(
    projectUuid,
    scenarioId
  );

  const existingEntities = useCanvasStore((state) => state.entities);
  const { data: entityTypes, isLoading: isTypesLoading } = useSystemEntityTypes();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [systemTypeUuid, setSystemTypeUuid] = useState('');
  const [parent, setParent] = useState(initialParent ?? '');
  const [x, setX] = useState<string>(
    initialPosition ? String(initialPosition.x) : '0'
  );
  const [y, setY] = useState<string>(
    initialPosition ? String(initialPosition.y) : '0'
  );
  const [z, setZ] = useState<string>(
    initialPosition?.z !== undefined ? String(initialPosition.z) : '0'
  );
  const [error, setError] = useState<string | null>(null);

  // 1. فیلتر کردن داینامیک نوع سیستم بر اساس وضعیت والد
  const availableTypes = useMemo(() => {
    if (!entityTypes) return [];
    return entityTypes.filter((type: SystemEntityType) => {
      // اگر والد انتخاب شده باشد، تمام انواع سیستم می‌توانند فرزند باشند
      if (parent) return true;
      // اگر والد انتخاب نشده باشد (موجودیت روت)، فقط مواردی که مجاز هستند نمایش داده شوند
      return type.is_root_allowed;
    });
  }, [entityTypes, parent]);

  // 2. انتخاب خودکار اولین نوع سیستم معتبر در لیست فیلتر شده
  useEffect(() => {
    if (availableTypes.length > 0) {
      const isCurrentValueValid = availableTypes.some((t) => t.uuid === systemTypeUuid);
      // اگر مقدار فعلی خالی است یا در لیست جدید (فیلتر شده) وجود ندارد، آن را تغییر بده
      if (!systemTypeUuid || !isCurrentValueValid) {
        setSystemTypeUuid(availableTypes[0].uuid);
      }
    } else {
      setSystemTypeUuid('');
    }
  }, [availableTypes, systemTypeUuid]);

  // ریست کردن فرم در زمان باز شدن مودال
  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setCode('');
    setDescription('');
    setParent(initialParent ?? '');
    setX(initialPosition ? String(initialPosition.x) : '0');
    setY(initialPosition ? String(initialPosition.y) : '0');
    setZ(initialPosition?.z !== undefined ? String(initialPosition.z) : '0');
    setError(null);
    // نکته: نیازی به تنظیم systemTypeUuid در اینجا نیست، چون useEffect بالا
    // به محض تغییر parent (که اینجا تنظیم می‌شود) آن را هندل می‌کند.
  }, [isOpen, initialParent, initialPosition]);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      code.trim().length > 0 &&
      systemTypeUuid.trim().length > 0
    );
  }, [name, code, systemTypeUuid]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      setError('نام سیستم و کد الزامی است.');
      return;
    }

    const parsedX = Number(x);
    const parsedY = Number(y);
    const parsedZ = Number(z);

    if (
      Number.isNaN(parsedX) ||
      Number.isNaN(parsedY) ||
      Number.isNaN(parsedZ)
    ) {
      setError('مختصات X و Y و Z باید عدد معتبر باشند.');
      return;
    }

    setError(null);

    const payload = {
      project: projectUuid,
      name: name.trim(),
      code: code.trim(),
      system_type_uuid: systemTypeUuid,
      pos_x: parsedX,
      pos_y: parsedY,
      pos_z: parsedZ,
      ...(description.trim()
        ? { metadata: { description: description.trim() } }
        : {}),
      ...(parent.trim() ? { parent: parent.trim() } : {}),
    };

    try {
      console.log('CREATE SYSTEM PAYLOAD =>', payload);
      await createSystemEntity(payload);
      onClose();
    } catch (e: any) {
      const backendError = e?.response?.data;
      console.error('CREATE SYSTEM ERROR =>', backendError || e);

      if (typeof backendError === 'string') {
        setError(backendError);
        return;
      }

      if (backendError && typeof backendError === 'object') {
        const readableMessage = Object.entries(backendError)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join('، ')}`;
            }
            return `${field}: ${String(messages)}`;
          })
          .join(' | ');

        setError(readableMessage || 'خطا در ایجاد سیستم.');
        return;
      }

      setError(e instanceof Error ? e.message : 'خطا در ایجاد سیستم.');
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
        className="space-y-4" 
        dir="rtl"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            نام سیستم
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً پل"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending}
          />
        </div>

          <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            کد
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="مثلاً BR-001"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending}
          />
        </div>


        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            نوع موجودیت
          </label>

          <select
            value={systemTypeUuid}
            onChange={(e) => setSystemTypeUuid(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending || isTypesLoading || availableTypes.length === 0}
          >
            {isTypesLoading ? (
              <option value="">در حال دریافت اطلاعات...</option>
            ) : availableTypes.length === 0 ? (
              <option value="">نوع سیستم مجاز وجود ندارد</option>
            ) : (
              availableTypes.map((type: SystemEntityType) => (
                <option key={type.uuid} value={type.uuid}>
                  {type.name} {type.code ? `(${type.code})` : ''}
                </option>
              ))
            )}
          </select>

          {!isTypesLoading && availableTypes.length === 0 && (
            <p className="mt-1 text-xs text-red-600">
              برای حالت فعلی (بدون والد) هیچ نوع سیستمی که اجازه روت داشته باشد
              تعریف نشده است.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            توضیحات
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیحات اختیاری..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            والد (انتخابی)
          </label>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            <option value="">-- بدون والد --</option>
            {existingEntities.map((entity: any) => (
              <option key={entity.uuid} value={entity.uuid}>
                {entity.name} {entity.code ? `(${entity.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              مختصات X
            </label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              مختصات Y
            </label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              مختصات Z
            </label>
            <input
              type="number"
              value={z}
              onChange={(e) => setZ(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              disabled={isPending}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 break-words">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending || isTypesLoading || availableTypes.length === 0}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'در حال ایجاد...' : 'ایجاد سیستم'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
