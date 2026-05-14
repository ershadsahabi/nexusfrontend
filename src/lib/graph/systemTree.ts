// src/lib/graph/systemTree.ts

import type {
  CanvasEntity,
} from '@/lib/types/canvas.types';

/**
 * Returns all root systems.
 * Root systems are entities without parent.
 */
export function findRootSystems(
  entities: CanvasEntity[]
): CanvasEntity[] {
  return entities.filter(
    (entity) =>
      entity.parentId === null ||
      entity.parentId === undefined
  );
}

  
/**
 * Fast entity lookup map by uuid.
 */
export function buildEntityMap(
  entities: CanvasEntity[]
): Map<string, CanvasEntity> {
  return new Map(
    entities.map((entity) => [
      entity.uuid,
      entity,
    ])
  );
}

/**
 * Creates hierarchical children map.
 *
 * parentId → parent uuid
 */
export function buildChildrenMap(
  entities: CanvasEntity[]
) {
  const childrenMap = new Map<string, CanvasEntity[]>();

  for (const e of entities) {
    childrenMap.set(e.uuid, []);
  }

  for (const e of entities) {
    const parentUuid = e.parentId;

    if (!parentUuid) continue;

    const list = childrenMap.get(parentUuid);

    if (list) {
      list.push(e);
    }
  }

  return childrenMap;
}


/**
 * Collect subtree recursively.
 *
 * depth:
 * - undefined => full subtree
 * - 0 => only current node
 * - 1 => node + direct children
 */
export function collectSubtree(
  rootUuid: string,
  childrenMap: Map<
    string,
    CanvasEntity[]
  >,
  depth?: number
): Set<string> {
  const result = new Set<string>();

  function traverse(
    uuid: string,
    level: number
  ) {
    result.add(uuid);

    /**
     * Depth limit reached
     */
    if (
      depth !== undefined &&
      level >= depth
    ) {
      return;
    }

    const children =
      childrenMap.get(uuid) ?? [];

    for (const child of children) {
      traverse(
        child.uuid,
        level + 1
      );
    }
  }

  traverse(rootUuid, 0);

  return result;
}

/**
 * Returns full hierarchy tree
 * for dropdown/tree navigation.
 */
export function buildHierarchyTree(
  entities: CanvasEntity[]
) {
  const childrenMap =
    buildChildrenMap(entities);

  const roots =
    findRootSystems(entities);

  function buildNode(
    entity: CanvasEntity
  ) {
    return {
      entity,

      children: (
        childrenMap.get(entity.uuid) ??
        []
      ).map(buildNode),
    };
  }

  return roots.map(buildNode);
}
