// src/lib/graph/visibility.ts

import type {
  CanvasConnection,
  CanvasEntity,
} from '@/lib/types/canvas.types';

import {
  buildChildrenMap,
  buildEntityMap,
  collectSubtree,
  findRootSystems,
} from './systemTree';

/**
 * Collect ancestor chain from node → root
 */
function collectAncestors(
  uuid: string,
  entityMap: Map<string, CanvasEntity>
) {
  const result = new Set<string>();

  let current = entityMap.get(uuid);

  while (current && current.parentId) {
    result.add(current.parentId);
    current = entityMap.get(current.parentId);
  }

  return result;
}

/**
 * Controls which part of graph
 * should be visible in canvas.
 */
export function filterVisibleGraph(
  entities: CanvasEntity[],
  connections: CanvasConnection[],
  rootUuid: string | null,
  depth: number,
  focusUuid?: string | null
) {

  /**
   * No root selected
   * -> show only root systems
   */
  if (!rootUuid) {
    const roots = findRootSystems(entities);

    const rootSet = new Set(
      roots.map((root) => root.uuid)
    );

    return {
      entities: roots,
      connections: connections.filter(
        (connection) =>
          rootSet.has(connection.sourceUuid) &&
          rootSet.has(connection.targetUuid)
      ),
    };
  }

  /**
   * Build hierarchy structures
   */
  const childrenMap = buildChildrenMap(entities);
  const entityMap = buildEntityMap(entities);

  /**
   * Step 1:
   * visible subtree from root
   */
  const rootVisibleSet = collectSubtree(
    rootUuid,
    childrenMap,
    depth
  );

  let visibleEntitySet = rootVisibleSet;

  /**
   * Step 2:
   * focus drill-down
   */
  if (
    focusUuid &&
    rootVisibleSet.has(focusUuid)
  ) {
    const focusSubtree = collectSubtree(
      focusUuid,
      childrenMap,
      depth
    );

    const ancestors = collectAncestors(
      focusUuid,
      entityMap
    );

    const merged = new Set<string>();

    for (const id of ancestors) {
      if (rootVisibleSet.has(id)) {
        merged.add(id);
      }
    }

    for (const id of focusSubtree) {
      if (rootVisibleSet.has(id)) {
        merged.add(id);
      }
    }

    merged.add(focusUuid);

    visibleEntitySet = merged;
  }

  /**
   * Filter entities
   */
  const visibleEntities = entities.filter(
    (entity) =>
      visibleEntitySet.has(entity.uuid)
  );

  /**
   * Filter connections
   */
  const visibleConnections =
    connections.filter(
      (connection) =>
        visibleEntitySet.has(
          connection.sourceUuid
        ) &&
        visibleEntitySet.has(
          connection.targetUuid
        )
    );

  return {
    entities: visibleEntities,
    connections: visibleConnections,
  };
}
