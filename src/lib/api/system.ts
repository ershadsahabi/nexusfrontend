// src/lib/api/system.ts

import axios from 'axios';

import { apiClient } from '@/lib/api/axios';

import type {
  ApiConnectionEdge,
  ApiEntityType,
  ApiProjectGraphResponse,
  ApiSystemEntity,
  ApiSystemEntityTypeSummary,
} from '@/lib/types/api.types';

type ApiContext = {
  projectUuid: string;
  scenarioId?: string;
};

export interface CreateSystemEntityPayload {
  name: string;
  code?: string;
  description?: string;

  entity_type?: ApiEntityType;
  system_type_uuid?: string | null;

  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number | null;

  sort_order?: number;
  is_active?: boolean;

  metadata?: Record<string, unknown> | null;
  parent?: string | null;
}

export interface UpdateSystemEntityPayload {
  name?: string;
  code?: string;
  description?: string;

  entity_type?: ApiEntityType;
  system_type_uuid?: string | null;

  pos_x?: number | null;
  pos_y?: number | null;
  pos_z?: number | null;

  sort_order?: number;
  is_active?: boolean;

  metadata?: Record<string, unknown> | null;
  parent?: string | null;
}

export interface CreateConnectionPayload {
  source_entity: string;
  target_entity: string;
  relation_type?: string;
  weight?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateConnectionPayload {
  source_entity?: string;
  target_entity?: string;
  relation_type?: string;
  weight?: number;
  metadata?: Record<string, unknown> | null;
}





export type ApiErrorMap = {
  nonFieldErrors: string[];
  fieldErrors: Record<string, string[]>;
};

export const FIELD_LABELS: Record<string, string> = {
  name: 'نام',
  code: 'کد',
  description: 'توضیحات',

  entity_type: 'نوع المان',
  system_type: 'نوع سیستم',
  system_type_uuid: 'نوع سیستم',

  parent: 'والد',
  sort_order: 'ترتیب نمایش',
  is_active: 'وضعیت فعال',

  pos_x: 'مختصات X',
  pos_y: 'مختصات Y',
  pos_z: 'مختصات Z',

  metadata: 'متادیتا',
  project: 'پروژه',
  project_uuid: 'پروژه',

  system_entity: 'موجودیت سیستمی',
  system_entity_uuid: 'موجودیت سیستمی',
  system_entity_uuids: 'موجودیت‌های سیستمی',
  missing: 'موارد پیدا نشده',

  detail: 'خطا',
  non_field_errors: 'خطا',
};

const BACKEND_ERROR_TRANSLATIONS: Record<string, string> = {
  // SystemEntity validation errors
  'Parent entity must belong to the same project.':
    'والد باید متعلق به همین پروژه باشد.',
  'Entity cannot be parent of itself.':
    'یک موجودیت نمی‌تواند والد خودش باشد.',
  'Selected parent type does not allow children.':
    'نوع والد انتخاب‌شده اجازه داشتن فرزند را نمی‌دهد.',
  'Circular hierarchy detected.':
    'در ساختار سلسله‌مراتبی چرخه تشخیص داده شد.',
  'This system type cannot be used as a root entity.':
    'این نوع سیستم برای موجودیت ریشه مجاز نیست.',
  'This system type is not FEM-eligible.':
    'نوع سیستم انتخاب‌شده برای FEM مجاز نیست.',
  'Environment entities should use an environment category system type.':
    'برای موجودیت محیطی باید نوع سیستم از دسته محیطی انتخاب شود.',

  // Common DRF errors
  'This field is required.':
    'این فیلد الزامی است.',
  'This field may not be blank.':
    'این فیلد نمی‌تواند خالی باشد.',
  'This field may not be null.':
    'این فیلد نمی‌تواند null باشد.',
  'Ensure this field has no more than 255 characters.':
    'طول این فیلد نباید بیشتر از ۲۵۵ کاراکتر باشد.',
  'Enter a valid UUID.':
    'UUID واردشده معتبر نیست.',
  'Invalid pk.':
    'شناسه انتخاب‌شده معتبر نیست.',
  'Not found.':
    'موردی پیدا نشد.',
  'A valid integer is required.':
    'یک عدد صحیح معتبر وارد کنید.',
  'A valid number is required.':
    'یک عدد معتبر وارد کنید.',
  'Must be a valid boolean.':
    'مقدار باید بولی معتبر باشد.',
  'Incorrect type. Expected pk value, received str.':
    'نوع مقدار ارسال‌شده برای شناسه معتبر نیست.',
  'Invalid data. Expected a dictionary, but got str.':
    'داده ارسال‌شده معتبر نیست.',
  'Authentication credentials were not provided.':
    'اطلاعات احراز هویت ارسال نشده است.',
  'You do not have permission to perform this action.':
    'شما مجوز انجام این عملیات را ندارید.',

  // FEM model errors
  'System entity not found.':
    'موجودیت سیستمی پیدا نشد.',
  'Selected system entity does not belong to the current project.':
    'موجودیت انتخاب‌شده متعلق به پروژه فعلی نیست.',
  'Selected system entity is not FEM-eligible.':
    'این موجودیت برای ایجاد مدل FEM مجاز نیست.',
  'A FEM model already exists for this system entity.':
    'برای این موجودیت، مدل FEM از قبل ایجاد شده است.',
  'Changing linked system entity is not allowed.':
    'تغییر موجودیت متصل به مدل FEM مجاز نیست.',
  'System entity resolution failed.':
    'تطبیق موجودیت سیستمی با خطا مواجه شد.',
  'Project UUID is required.':
    'شناسه پروژه الزامی است.',
  'System entity UUID is required.':
    'شناسه موجودیت سیستمی الزامی است.',
  'System entity not found in current project.':
    'موجودیت سیستمی در پروژه فعلی پیدا نشد.',

  // FEM bulk status errors
  'Some system entities were not found in the current project.':
    'برخی موجودیت‌های سیستمی در پروژه فعلی پیدا نشدند.',
};

function buildProjectParams(projectUuid: string) {
  return {
    project: projectUuid,
  };
}

function normalizeErrorField(field: string): string {
  if (field === 'system_type') return 'system_type_uuid';
  return field;
}

function translateKnownFragments(message: string): string {
  // برای پیام‌های DRF که بخشی از متنشان متغیر است.
  if (message.includes('Invalid pk')) {
    return 'شناسه انتخاب‌شده معتبر نیست.';
  }

  if (message.includes('object does not exist')) {
    return 'مورد انتخاب‌شده وجود ندارد.';
  }

  if (message.includes('is not a valid choice')) {
    return 'گزینه انتخاب‌شده معتبر نیست.';
  }

  if (message.includes('Ensure this value is greater than or equal to')) {
    return 'مقدار واردشده کمتر از حد مجاز است.';
  }

  if (message.includes('Ensure this value is less than or equal to')) {
    return 'مقدار واردشده بیشتر از حد مجاز است.';
  }

  return message;
}

export function translateErrorMessage(message: string): string {
  const normalized = message.trim();

  if (BACKEND_ERROR_TRANSLATIONS[normalized]) {
    return BACKEND_ERROR_TRANSLATIONS[normalized];
  }

  return translateKnownFragments(normalized);
}

function extractErrorMessages(value: unknown): string[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => extractErrorMessages(item))
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    const nestedMessages: string[] = [];

    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const label = FIELD_LABELS[nestedKey] ?? nestedKey;
      const messages = extractErrorMessages(nestedValue);

      for (const message of messages) {
        nestedMessages.push(`${label}: ${message}`);
      }
    }

    return nestedMessages;
  }

  return [translateErrorMessage(String(value))];
}

export function parseSystemErrors(error: unknown): ApiErrorMap {
  const fallback: ApiErrorMap = {
    nonFieldErrors: ['عملیات با خطا مواجه شد.'],
    fieldErrors: {},
  };

  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (!data) {
    return {
      nonFieldErrors: ['ارتباط با سرور برقرار نشد یا پاسخ معتبری دریافت نشد.'],
      fieldErrors: {},
    };
  }

  if (typeof data === 'string') {
    return {
      nonFieldErrors: [translateErrorMessage(data)],
      fieldErrors: {},
    };
  }

  if (typeof data !== 'object') {
    return fallback;
  }

  const nonFieldErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  for (const [rawKey, rawValue] of Object.entries(data)) {
    const key = normalizeErrorField(rawKey);
    const messages = extractErrorMessages(rawValue);

    if (messages.length === 0) continue;

    if (key === 'non_field_errors' || key === 'detail') {
      nonFieldErrors.push(...messages);
      continue;
    }

    fieldErrors[key] = messages;
  }

  if (nonFieldErrors.length === 0 && Object.keys(fieldErrors).length === 0) {
    return fallback;
  }

  return {
    nonFieldErrors,
    fieldErrors,
  };
}

export function buildSystemEntityErrorSummary(errors: ApiErrorMap): string[] {
  const summary: string[] = [];

  summary.push(...errors.nonFieldErrors);

  for (const [field, messages] of Object.entries(errors.fieldErrors)) {
    const label = FIELD_LABELS[field] ?? field;

    for (const message of messages) {
      summary.push(`${label}: ${message}`);
    }
  }

  return summary;
}

export function getFirstSystemEntityFieldError(
  errors: ApiErrorMap | null | undefined,
  fieldName: string
): string | null {
  if (!errors) return null;

  const normalizedFieldName = normalizeErrorField(fieldName);

  return errors.fieldErrors?.[normalizedFieldName]?.[0] ?? null;
}

export function hasSystemEntityFieldError(
  errors: ApiErrorMap | null | undefined,
  fieldName: string
): boolean {
  return Boolean(getFirstSystemEntityFieldError(errors, fieldName));
}

function uniqueStrings(input: string[]): string[] {
  return [...new Set(input.filter(Boolean))];
}

function chunkArray<T>(input: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [input];

  const chunks: T[][] = [];

  for (let index = 0; index < input.length; index += chunkSize) {
    chunks.push(input.slice(index, index + chunkSize));
  }

  return chunks;
}

export async function fetchSystemEntityTypes(): Promise<ApiSystemEntityTypeSummary[]> {
  const { data } = await apiClient.get('/entities/system-entity-types/');
  return data.results ?? data ?? [];
}

export async function fetchProjectGraph(
  projectUuid: string,
  _scenarioId?: string
): Promise<ApiProjectGraphResponse> {
  const params = buildProjectParams(projectUuid);

  const [entitiesRes, connectionsRes] = await Promise.all([
    apiClient.get('/entities/system-entities/', { params }),
    apiClient.get('/entities/connections/', { params }),
  ]);

  return {
    entities: entitiesRes.data?.results ?? entitiesRes.data ?? [],
    connections: connectionsRes.data?.results ?? connectionsRes.data ?? [],
  };
}

export async function createSystemEntity(
  projectUuid: string,
  payload: CreateSystemEntityPayload,
  _scenarioId?: string
): Promise<ApiSystemEntity> {
  const body = {
    ...payload,
    project: projectUuid,
  };

  const { data } = await apiClient.post('/entities/system-entities/', body, {
    params: buildProjectParams(projectUuid),
  });

  return data;
}

export async function updateSystemEntity(
  entityUuid: string,
  payload: UpdateSystemEntityPayload,
  context: ApiContext
): Promise<ApiSystemEntity> {
  if (!context?.projectUuid) {
    throw new Error('updateSystemEntity: projectUuid is required');
  }

  if (!entityUuid || typeof entityUuid !== 'string') {
    throw new Error('updateSystemEntity: entityUuid is required');
  }

  const { data } = await apiClient.patch(
    `/entities/system-entities/${entityUuid}/`,
    payload,
    {
      params: buildProjectParams(context.projectUuid),
    }
  );

  return data;
}

export async function deleteSystemEntity(
  entityUuid: string,
  context: ApiContext
): Promise<void> {
  if (!context?.projectUuid) {
    throw new Error('deleteSystemEntity: projectUuid is required');
  }

  if (!entityUuid || typeof entityUuid !== 'string') {
    throw new Error('deleteSystemEntity: entityUuid is required');
  }

  await apiClient.delete(`/entities/system-entities/${entityUuid}/`, {
    params: buildProjectParams(context.projectUuid),
  });
}

export async function createConnection(
  projectUuid: string,
  payload: CreateConnectionPayload
): Promise<ApiConnectionEdge> {
  const body = {
    ...payload,
    project: projectUuid,
  };

  const { data } = await apiClient.post('/entities/connections/', body, {
    params: buildProjectParams(projectUuid),
  });

  return data;
}

export async function updateConnection(
  connectionUuid: string,
  payload: UpdateConnectionPayload,
  context: ApiContext
): Promise<ApiConnectionEdge> {
  if (!context?.projectUuid) {
    throw new Error('updateConnection: projectUuid is required');
  }

  if (!connectionUuid || typeof connectionUuid !== 'string') {
    throw new Error('updateConnection: connectionUuid is required');
  }

  const { data } = await apiClient.patch(
    `/entities/connections/${connectionUuid}/`,
    payload,
    {
      params: buildProjectParams(context.projectUuid),
    }
  );

  return data;
}

export async function deleteConnection(
  connectionUuid: string,
  context: ApiContext
): Promise<void> {
  if (!context?.projectUuid) {
    throw new Error('deleteConnection: projectUuid is required');
  }

  if (!connectionUuid || typeof connectionUuid !== 'string') {
    throw new Error('deleteConnection: connectionUuid is required');
  }

  await apiClient.delete(`/entities/connections/${connectionUuid}/`, {
    params: buildProjectParams(context.projectUuid),
  });
}





