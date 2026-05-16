// src/lib/graph/visibility.ts

import type {
  CanvasConnection,
  CanvasEntity,
} from '@/lib/types/canvas.types';

import {
  buildChildrenMap,
  collectSubtree,
  findRootSystems,
} from './systemTree';

export function filterVisibleGraph(
  entities: CanvasEntity[],
  connections: CanvasConnection[],
  rootUuid: string | null,
  depth: number,
  focusUuid?: string | null
) {
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

  const childrenMap = buildChildrenMap(entities);

  const rootFullSet = collectSubtree(
    rootUuid,
    childrenMap
  );

  let visibleEntitySet = collectSubtree(
    rootUuid,
    childrenMap,
    depth
  );

  if (
    focusUuid &&
    rootFullSet.has(focusUuid)
  ) {
    visibleEntitySet = collectSubtree(
      focusUuid,
      childrenMap,
      depth
    );
  }

  const visibleEntities = entities.filter(
    (entity) =>
      visibleEntitySet.has(entity.uuid)
  );

  const visibleConnections =
    connections.filter(
      (connection) =>
        visibleEntitySet.has(connection.sourceUuid) &&
        visibleEntitySet.has(connection.targetUuid)
    );

  return {
    entities: visibleEntities,
    connections: visibleConnections,
  };
}
