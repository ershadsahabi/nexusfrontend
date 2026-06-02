// src/lib/metadata/utils.ts


import type {
  MetadataConfig,
  MetadataFieldGroup,
  MetadataSchema,
  MetadataSchemaField,
  MetadataValues,
} from './types';

export function ensureMetadataConfig(input: any): MetadataConfig {
  return {
    schema: input?.schema && typeof input.schema === 'object' ? input.schema : {},
    defaults:
      input?.defaults && typeof input.defaults === 'object'
        ? input.defaults
        : {},
  };
}

export function buildEffectiveMetadata(
  defaults?: MetadataValues | null,
  overrides?: MetadataValues | null
): MetadataValues {
  return {
    ...(defaults ?? {}),
    ...(overrides ?? {}),
  };
}

export function getMetadataInitialValues(params: {
  schema?: MetadataSchema | null;
  defaults?: MetadataValues | null;
  values?: MetadataValues | null;
}): MetadataValues {
  const schema = params.schema ?? {};
  const merged = buildEffectiveMetadata(params.defaults, params.values);

  const result: MetadataValues = {};

  for (const key of Object.keys(schema)) {
    if (merged[key] !== undefined) {
      result[key] = merged[key];
    }
  }

  return result;
}

export function getMetadataGroups(
  schema: MetadataSchema
): MetadataFieldGroup[] {
  const groupMap = new Map<string, MetadataFieldGroup>();

  Object.entries(schema).forEach(([key, field]) => {
    const groupName = field.group?.trim() || 'General';

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        name: groupName,
        fields: [],
      });
    }

    groupMap.get(groupName)!.fields.push({ key, field });
  });

  return Array.from(groupMap.values());
}

export function normalizeMetadataValueByField(
  field: MetadataSchemaField,
  rawValue: unknown
): unknown {
  if (rawValue === undefined) return undefined;
  if (rawValue === null) return null;

  switch (field.type) {
    case 'number': {
      if (rawValue === '') return '';
      const num = Number(rawValue);
      return Number.isFinite(num) ? num : '';
    }

    case 'integer': {
      if (rawValue === '') return '';
      const num = Number(rawValue);
      return Number.isFinite(num) ? Math.trunc(num) : '';
    }

    case 'boolean':
      return Boolean(rawValue);

    case 'select':
      return rawValue;

    case 'string':
    default:
      return String(rawValue);
  }
}

export function sanitizeMetadataForSubmit(
  schema: MetadataSchema,
  values: MetadataValues
): MetadataValues {
  const result: MetadataValues = {};

  Object.entries(schema).forEach(([key, field]) => {
    const raw = values[key];

    if (raw === undefined) return;

    if (field.type === 'string') {
      const str = String(raw ?? '').trim();
      if (str !== '') result[key] = str;
      return;
    }

    if (field.type === 'number') {
      if (raw === '') return;
      const num = Number(raw);
      if (Number.isFinite(num)) result[key] = num;
      return;
    }

    if (field.type === 'integer') {
      if (raw === '') return;
      const num = Number(raw);
      if (Number.isFinite(num)) result[key] = Math.trunc(num);
      return;
    }

    if (field.type === 'boolean') {
      result[key] = Boolean(raw);
      return;
    }

    if (field.type === 'select') {
      if (raw !== '') result[key] = raw;
      return;
    }
  });

  return result;
}

export function buildMetadataOverrides(
  defaults: MetadataValues = {},
  values: MetadataValues = {}
): MetadataValues {
  const overrides: MetadataValues = {};

  Object.keys(values).forEach((key) => {
    const defaultValue = defaults[key];
    const currentValue = values[key];

    if (JSON.stringify(defaultValue) !== JSON.stringify(currentValue)) {
      overrides[key] = currentValue;
    }
  });

  return overrides;
}

export function getOptionLabel(option: any): string {
  if (
    option &&
    typeof option === 'object' &&
    'value' in option
  ) {
    return String(option.label ?? option.value);
  }

  return String(option);
}

export function getOptionValue(option: any): string | number | boolean {
  if (
    option &&
    typeof option === 'object' &&
    'value' in option
  ) {
    return option.value;
  }

  return option;
}


