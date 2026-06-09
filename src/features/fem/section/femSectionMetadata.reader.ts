// src/features/fem/section/femSectionMetadata.reader.ts


import type { CanvasEntity } from '@/lib/types/canvas.types';

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function asRecord(value: unknown): AnyRecord {
  return isRecord(value) ? value : {};
}

export function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

export function getFirstNumber(
  values: unknown[],
  fallback: number
): number {
  for (const value of values) {
    const parsed = getNumber(value);
    if (parsed !== null) return parsed;
  }

  return fallback;
}

export function normalizeSectionKind(value: unknown): string | null {
  const raw = getString(value);
  if (!raw) return null;

  const normalized = raw.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');

  if (normalized === 'rectangle') return 'rectangular';
  if (normalized === 'rect') return 'rectangular';
  if (normalized === 'box') return 'box';
  if (normalized === 'box_culvert') return 'box_culvert';
  if (normalized === 'culvert') return 'box_culvert';
  if (normalized === 'circle') return 'circular';
  if (normalized === 'circular') return 'circular';
  if (normalized === 'cylinder') return 'cylinder';
  if (normalized === 'i') return 'i_shape';
  if (normalized === 'i_section') return 'i_shape';
  if (normalized === 'i_shape') return 'i_shape';

  return normalized;
}

function getNestedRecord(source: AnyRecord, path: string[]): AnyRecord {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) return {};
    current = current[key];
  }

  return asRecord(current);
}

function mergeRecords(...records: AnyRecord[]): AnyRecord {
  return records.reduce<AnyRecord>(
    (acc, item) => ({
      ...acc,
      ...item,
    }),
    {}
  );
}

function resolveBindings(
  bindings: AnyRecord,
  metadata: AnyRecord
): AnyRecord {
  const resolved: AnyRecord = {};

  for (const [propName, metadataField] of Object.entries(bindings)) {
    if (typeof metadataField !== 'string' || !metadataField.trim()) continue;
    resolved[propName] = metadata[metadataField];
  }

  return resolved;
}

export function getEntityEffectiveMetadata(entity: CanvasEntity): AnyRecord {
  const raw = entity as unknown as AnyRecord;

  return mergeRecords(
    asRecord(raw.effective_metadata),
    asRecord(raw.effectiveMetadata),
    asRecord(entity.metadata)
  );
}

export function getSystemTypeDefaults(entity: CanvasEntity): AnyRecord {
  return asRecord(entity.systemType?.metadata_defaults);
}

export function getVisualSectionCandidate(entity: CanvasEntity): AnyRecord {
  const visualDefinition = asRecord(entity.systemType?.visual_definition);
  const staticProps = asRecord(
    visualDefinition.static_props ?? visualDefinition.staticProps
  );
  const bindings = asRecord(visualDefinition.bindings);
  const metadata = mergeRecords(getSystemTypeDefaults(entity), getEntityEffectiveMetadata(entity));
  const boundProps = resolveBindings(bindings, metadata);
  const material = asRecord(visualDefinition.material);

  const renderer = getString(visualDefinition.renderer);

  if (!renderer && Object.keys(staticProps).length === 0 && Object.keys(boundProps).length === 0) {
    return {};
  }

  return {
    kind: renderer,
    dimensions: {
      ...staticProps,
      ...boundProps,
    },
    material,
  };
}

export function getFemSectionCandidate(entity: CanvasEntity): {
  source: 'entity_metadata' | 'system_type_metadata' | 'visual_definition' | 'fallback';
  value: AnyRecord;
} {
  const entityMetadata = getEntityEffectiveMetadata(entity);
  const systemDefaults = getSystemTypeDefaults(entity);
  const systemSchema = asRecord(entity.systemType?.metadata_schema);

  const entityFemSection = getNestedRecord(entityMetadata, ['fem', 'section']);
  if (Object.keys(entityFemSection).length > 0) {
    return {
      source: 'entity_metadata',
      value: entityFemSection,
    };
  }

  const entitySection = asRecord(entityMetadata.section);
  if (Object.keys(entitySection).length > 0) {
    return {
      source: 'entity_metadata',
      value: entitySection,
    };
  }

  const defaultsFemSection = getNestedRecord(systemDefaults, ['fem', 'section']);
  if (Object.keys(defaultsFemSection).length > 0) {
    return {
      source: 'system_type_metadata',
      value: mergeRecords(defaultsFemSection, entityMetadata),
    };
  }

  const defaultsSection = asRecord(systemDefaults.section);
  if (Object.keys(defaultsSection).length > 0) {
    return {
      source: 'system_type_metadata',
      value: mergeRecords(defaultsSection, entityMetadata),
    };
  }

  const schemaFemSection = getNestedRecord(systemSchema, ['fem', 'section']);
  if (Object.keys(schemaFemSection).length > 0) {
    return {
      source: 'system_type_metadata',
      value: mergeRecords(schemaFemSection, systemDefaults, entityMetadata),
    };
  }

  const visualCandidate = getVisualSectionCandidate(entity);
  if (Object.keys(visualCandidate).length > 0) {
    return {
      source: 'visual_definition',
      value: visualCandidate,
    };
  }

  return {
    source: 'fallback',
    value: {},
  };
}
