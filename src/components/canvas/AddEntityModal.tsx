// src/components/canvas/AddEntityModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { useCreateSystemEntity } from '@/hooks/useCreateSystemEntity';

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
  scenarioId, // فعلاً استفاده نمی‌شود چون serializer این فیلد را ندارد
  initialParent = null,
  initialPosition = null,
}: AddEntityModalProps) {
  const { mutateAsync: createSystemEntity, isPending } = useCreateSystemEntity(
    projectUuid,
    scenarioId
  );

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('macro');
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

  useEffect(() => {
    if (!isOpen) return;

    setName('');
    setCode('');
    setDescription('');
    setEntityType('macro');
    setParent(initialParent ?? '');
    setX(initialPosition ? String(initialPosition.x) : '0');
    setY(initialPosition ? String(initialPosition.y) : '0');
    setZ(initialPosition?.z !== undefined ? String(initialPosition.z) : '0');
    setError(null);
  }, [isOpen, initialParent, initialPosition]);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      code.trim().length > 0 &&
      entityType.trim().length > 0
    );
  }, [name, code, entityType]);

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
      entity_type: entityType.trim(), // macro | fem | environment | generic
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
      <div className="space-y-4" dir="rtl">
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
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending}
          >
            <option value="macro">Macro</option>
            <option value="fem">FEM</option>
            <option value="environment">Environment</option>
            <option value="generic">Generic</option>
          </select>
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
            والد (UUID)
          </label>
          <input
            type="text"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            placeholder="اختیاری"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            disabled={isPending}
          />
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
            disabled={!isValid || isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'در حال ایجاد...' : 'ایجاد سیستم'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
