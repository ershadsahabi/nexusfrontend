// src/lib/graph/visibility.ts

import type {
  CanvasConnection,
  CanvasEntity,
} from '@/lib/types/canvas.types';

import {
  buildSystemTree,
  getAncestorUuids,
  getSubtreeUuids,
} from './systemTree';

type CanvasEntityWithLegacyParent = CanvasEntity & {
  parentId?: string | null;
};

export interface GraphVisibilityOptions {
  activeRootSystemUuid?: string | null;
  viewDepth?: number | null;
  focusEntityUuid?: string | null;
}

export interface VisibleGraph {
  entities: CanvasEntity[];
  connections: CanvasConnection[];
}

function getRawParentUuid(entity: CanvasEntity): string | null {
  const candidate = entity as CanvasEntityWithLegacyParent;
  return candidate.parentUuid ?? candidate.parentId ?? null;
}

function sortEntities(entities: CanvasEntity[]): CanvasEntity[] {
  return [...entities].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

function getRealRootUuids(entities: CanvasEntity[]): Set<string> {
  const entityUuidSet = new Set(entities.map((entity) => entity.uuid));

  return new Set(
    entities
      .filter((entity) => {
        const parentUuid = getRawParentUuid(entity);

        if (!parentUuid) return true;
        return !entityUuidSet.has(parentUuid);
      })
      .map((entity) => entity.uuid)
  );
}

function collectVisibleByDepth(
  rootUuid: string,
  tree: ReturnType<typeof buildSystemTree>,
  maxDepth: number | null
): Set<string> {
  const result = new Set<string>();
  const startNode = tree.nodesByUuid.get(rootUuid);

  if (!startNode) return result;

  const stack: Array<{ uuid: string; localDepth: number }> = [
    { uuid: rootUuid, localDepth: 0 },
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const { uuid, localDepth } = current;

    if (result.has(uuid)) continue;
    result.add(uuid);

    if (maxDepth !== null && localDepth >= maxDepth) {
      continue;
    }

    const node = tree.nodesByUuid.get(uuid);
    if (!node) continue;

    for (let i = node.children.length - 1; i >= 0; i -= 1) {
      stack.push({
        uuid: node.children[i].uuid,
        localDepth: localDepth + 1,
      });
    }
  }

  return result;
}

export function filterVisibleGraph(
  entities: CanvasEntity[],
  connections: CanvasConnection[],
  options?: GraphVisibilityOptions | null
): VisibleGraph {
  const activeRootSystemUuid = options?.activeRootSystemUuid ?? null;
  const viewDepth =
    typeof options?.viewDepth === 'number' ? Math.max(0, options.viewDepth) : null;
  const focusEntityUuid = options?.focusEntityUuid ?? null;

  if (!entities.length) {
    return {
      entities: [],
      connections: [],
    };
  }

  const entityUuidSet = new Set(entities.map((entity) => entity.uuid));
  const entityByUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
  const tree = buildSystemTree(entities);

  let visibleUuids: Set<string>;

  if (focusEntityUuid && entityUuidSet.has(focusEntityUuid)) {
    visibleUuids = getSubtreeUuids(focusEntityUuid, entities);
  } else if (
    activeRootSystemUuid &&
    entityUuidSet.has(activeRootSystemUuid)
  ) {
    visibleUuids = collectVisibleByDepth(
      activeRootSystemUuid,
      tree,
      viewDepth
    );

    // برای اینکه ریشه‌ی انتخاب‌شده هرگز گم نشود
    visibleUuids.add(activeRootSystemUuid);

    // اگر root انتخاب‌شده در عمق داخلی باشد، اجدادش هم بمانند
    const ancestors = getAncestorUuids(activeRootSystemUuid, entities);
    for (const ancestorUuid of ancestors) {
      visibleUuids.add(ancestorUuid);
    }
  } else {
    // حالت همه سیستم‌ها:
    // فقط ریشه‌های واقعی دیده شوند، بدون فرزندها
    visibleUuids = getRealRootUuids(entities);
  }


  const visibleEntities = sortEntities(
    [...visibleUuids]
      .map((uuid) => entityByUuid.get(uuid))
      .filter((entity): entity is CanvasEntity => Boolean(entity))
  );

  const visibleEntityUuidSet = new Set(visibleEntities.map((entity) => entity.uuid));

  const visibleConnections = connections.filter(
    (connection) =>
      visibleEntityUuidSet.has(connection.sourceUuid) &&
      visibleEntityUuidSet.has(connection.targetUuid)
  );

  return {
    entities: visibleEntities,
    connections: visibleConnections,
  };
}
