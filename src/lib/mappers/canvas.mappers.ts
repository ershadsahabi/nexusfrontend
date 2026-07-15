// src/lib/mappers/canvas.mappers.ts

import type {
  ApiConnectionEdge,
  ApiProjectGraphResponse,
  ApiSystemEntity,
  ApiSystemEntityTypeSummary,
} from '@/lib/types/api.types';

import type {
  CanvasConnection,
  CanvasEntity,
  CanvasGraph,
  RelationType,
} from '@/lib/types/canvas.types';

type EntityIdToUuidMap = Map<number, string>;

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function extractUuid(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'object' && 'uuid' in value) {
    const uuid = (value as { uuid?: unknown }).uuid;

    if (typeof uuid === 'string') {
      const trimmed = uuid.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof uuid === 'number') {
      return String(uuid);
    }
  }

  return null;
}

function extractNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === 'number' && Number.isFinite(id)) {
      return id;
    }

    if (typeof id === 'string') {
      const parsed = Number(id);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

function resolveEntityEndpointUuid(
  value: unknown,
  entityIdToUuid: EntityIdToUuidMap
): string | null {
  const uuid = extractUuid(value);
  if (uuid) return uuid;

  const id = extractNumericId(value);
  if (id === null) return null;

  return entityIdToUuid.get(id) ?? null;
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function mapApiSystemEntityToCanvasEntity(
  entity: ApiSystemEntity
): CanvasEntity {
  const parentUuid = extractUuid(entity.parent);

  const systemType: ApiSystemEntityTypeSummary | null =
    entity.system_type && typeof entity.system_type === 'object'
      ? entity.system_type
      : null;

  return {
    uuid: entity.uuid,

    parentUuid,
    childrenUuids: [],

    name: entity.name ?? '',
    code: entity.code ?? '',
    description: entity.description ?? '',

    entityType: entity.entity_type ?? 'generic',

    systemTypeUuid: systemType?.uuid ?? null,
    systemTypeCode: systemType?.code ?? null,
    systemTypeName: systemType?.name ?? null,

    systemType,
    visualDefinition: systemType?.visual_definition ?? null,
    renderVariant: systemType?.render_variant ?? null,
    colorKey: systemType?.color_key ?? null,
    shapeKey: systemType?.shape_key ?? null,

    position: [
      normalizeNumber(entity.pos_x),
      normalizeNumber(entity.pos_y),
      normalizeNumber(entity.pos_z),
    ],

    sortOrder: normalizeNumber(entity.sort_order),
    isActive: Boolean(entity.is_active),

    metadata: normalizeMetadata(entity.metadata),
    effectiveMetadata: normalizeMetadata(entity.effective_metadata),

    isRoot: Boolean(entity.is_root),
    isLeaf: Boolean(entity.is_leaf),

    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

function normalizeRelationType(edge: ApiConnectionEdge): RelationType {
  return (
    edge.connection_type ||
    edge.relation_type ||
    'connected_to'
  ) as RelationType;
}

function extractConnectionEndpoint(
  edge: ApiConnectionEdge,
  keys: string[],
  entityIdToUuid: EntityIdToUuidMap
): string {
  const raw = edge as unknown as Record<string, unknown>;

  for (const key of keys) {
    const uuid = resolveEntityEndpointUuid(raw[key], entityIdToUuid);
    if (uuid) return uuid;
  }

  return '';
}

export function mapApiConnectionToCanvas(
  edge: ApiConnectionEdge,
  entityIdToUuid: EntityIdToUuidMap = new Map()
): CanvasConnection {
  const sourceUuid = extractConnectionEndpoint(
    edge,
    [
      'source_entity',
      'source_entity_uuid',
      'source_uuid',
      'source',
      'sourceUuid',
    ],
    entityIdToUuid
  );

  const targetUuid = extractConnectionEndpoint(
    edge,
    [
      'target_entity',
      'target_entity_uuid',
      'target_uuid',
      'target',
      'targetUuid',
    ],
    entityIdToUuid
  );

  const relationType = normalizeRelationType(edge);

  const uuid =
    typeof edge.uuid === 'string' && edge.uuid.trim()
      ? edge.uuid.trim()
      : typeof edge.id === 'number' && Number.isFinite(edge.id)
        ? `connection-${edge.id}`
        : `connection-${sourceUuid}-${targetUuid}-${relationType}`;

  return {
    uuid,
    sourceUuid,
    targetUuid,
    relationType,
    metadata: normalizeMetadata(edge.metadata),
    createdAt: edge.created_at,
    updatedAt: edge.updated_at,
  };
}

export function mapProjectGraphToCanvas(
  graph: ApiProjectGraphResponse
): CanvasGraph {
  const apiEntities = graph.entities ?? [];

  const entityIdToUuid: EntityIdToUuidMap = new Map();

  for (const entity of apiEntities) {
    if (typeof entity.id === 'number' && Number.isFinite(entity.id)) {
      entityIdToUuid.set(entity.id, entity.uuid);
    }
  }

  const entities = apiEntities.map(mapApiSystemEntityToCanvasEntity);
  const entityByUuid = new Map(entities.map((entity) => [entity.uuid, entity]));

  for (const entity of entities) {
    entity.childrenUuids = [];
  }

  for (const entity of entities) {
    if (!entity.parentUuid) continue;

    const parent = entityByUuid.get(entity.parentUuid);

    if (!parent) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[canvas.mapper] Parent not found for entity', {
          entityUuid: entity.uuid,
          entityName: entity.name,
          parentUuid: entity.parentUuid,
        });
      }

      continue;
    }

    parent.childrenUuids.push(entity.uuid);
  }

  for (const entity of entities) {
    entity.childrenUuids.sort((a, b) => {
      const entityA = entityByUuid.get(a);
      const entityB = entityByUuid.get(b);

      const sortA = entityA?.sortOrder ?? 0;
      const sortB = entityB?.sortOrder ?? 0;

      if (sortA !== sortB) return sortA - sortB;

      return (entityA?.name ?? '').localeCompare(entityB?.name ?? '');
    });

    entity.isRoot = entity.parentUuid === null;
    entity.isLeaf = entity.childrenUuids.length === 0;
  }

  const connections = (graph.connections ?? []).map((connection) =>
    mapApiConnectionToCanvas(connection, entityIdToUuid)
  );

  return {
    entities,
    connections,
  };
}
