// src/lib/mappers/canvas.mappers.ts

import type {
  ApiConnectionEdge,
  ApiProjectGraphResponse,
  ApiSystemEntity,
} from '@/lib/types/api.types';
import type {
  CanvasConnection,
  CanvasEntity,
  RelationType,
} from '@/lib/types/canvas.types';

function normalizeRelationType(edge: ApiConnectionEdge): RelationType {
  return (edge.connection_type || edge.relation_type || 'connected_to') as RelationType;
}

function buildConnectionUuid(edge: ApiConnectionEdge): string {
  if (edge.uuid && edge.uuid.trim()) return edge.uuid;
  return `connection-${edge.id}`;
}

export function mapApiEntityToCanvas(entity: ApiSystemEntity): CanvasEntity {
  return {
    id: entity.id,
    uuid: entity.uuid,

    parentId: entity.parent ?? null,
    childIds: entity.children ?? [],

    name: entity.name ?? '',
    code: entity.code ?? '',

    // entityType جای خود را به systemType داد
    systemType: entity.system_type,

    position: [
      Number(entity.pos_x ?? 0),
      Number(entity.pos_y ?? 0),
      Number(entity.pos_z ?? 0),
    ],

    sortOrder: Number(entity.sort_order ?? 0),

    metadata: entity.metadata ?? {},

    isRoot: Boolean(entity.is_root),
    isLeaf: Boolean(entity.is_leaf),

    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

export function mapApiConnectionToCanvas(
  edge: ApiConnectionEdge,
  entityUuidById: Map<number, string>
): CanvasConnection | null {
  const sourceUuid = entityUuidById.get(edge.source_entity);
  const targetUuid = entityUuidById.get(edge.target_entity);

  if (!sourceUuid || !targetUuid) {
    return null;
  }

  return {
    id: edge.id,
    uuid: buildConnectionUuid(edge),

    sourceId: edge.source_entity,
    targetId: edge.target_entity,

    sourceUuid,
    targetUuid,

    relationType: normalizeRelationType(edge),

    metadata: edge.metadata ?? {},

    createdAt: edge.created_at,
    updatedAt: edge.updated_at,
  };
}

export function mapProjectGraphToCanvas(graph: ApiProjectGraphResponse): {
  entities: CanvasEntity[];
  connections: CanvasConnection[];
} {
  const entities = (graph.entities ?? []).map(mapApiEntityToCanvas);

  const entityUuidById = new Map<number, string>(
    entities.map((entity) => [entity.id, entity.uuid])
  );

  const connections = (graph.connections ?? [])
    .map((edge) => mapApiConnectionToCanvas(edge, entityUuidById))
    .filter((edge): edge is CanvasConnection => Boolean(edge));

  return {
    entities,
    connections,
  };
}
