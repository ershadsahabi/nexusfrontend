// src/lib/graph/systemTree.ts

import type { CanvasEntity } from '@/lib/types/canvas.types';

type CanvasEntityWithLegacyParent = CanvasEntity & {
  parentId?: string | null;
};

export interface SystemTreeNode {
  uuid: string;
  entity: CanvasEntity;
  parentUuid: string | null;
  children: SystemTreeNode[];
  depth: number;
}

export interface SystemTree {
  roots: SystemTreeNode[];
  nodesByUuid: Map<string, SystemTreeNode>;
  childrenByParentUuid: Map<string | null, string[]>;
  entityByUuid: Map<string, CanvasEntity>;
}

function getRawParentUuid(entity: CanvasEntity): string | null {
  const candidate = entity as CanvasEntityWithLegacyParent;
  return candidate.parentUuid ?? candidate.parentId ?? null;
}

function getNormalizedParentUuid(
  entity: CanvasEntity,
  entityByUuid: Map<string, CanvasEntity>
): string | null {
  const rawParentUuid = getRawParentUuid(entity);

  if (!rawParentUuid) {
    return null;
  }

  return entityByUuid.has(rawParentUuid) ? rawParentUuid : null;
}

function sortEntityUuids(
  uuids: string[],
  entityByUuid: Map<string, CanvasEntity>
): string[] {
  return [...uuids].sort((a, b) => {
    const entityA = entityByUuid.get(a);
    const entityB = entityByUuid.get(b);

    const sortA = entityA?.sortOrder ?? 0;
    const sortB = entityB?.sortOrder ?? 0;

    if (sortA !== sortB) return sortA - sortB;

    const nameA = entityA?.name ?? '';
    const nameB = entityB?.name ?? '';

    return nameA.localeCompare(nameB);
  });
}

export function buildSystemTree(entities: CanvasEntity[]): SystemTree {
  const entityByUuid = new Map<string, CanvasEntity>();
  const childrenByParentUuid = new Map<string | null, string[]>();
  const nodesByUuid = new Map<string, SystemTreeNode>();

  for (const entity of entities) {
    entityByUuid.set(entity.uuid, entity);
  }

  for (const entity of entities) {
    const normalizedParentUuid = getNormalizedParentUuid(entity, entityByUuid);
    const siblings = childrenByParentUuid.get(normalizedParentUuid) ?? [];

    siblings.push(entity.uuid);
    childrenByParentUuid.set(normalizedParentUuid, siblings);
  }

  for (const [parentUuid, childUuids] of childrenByParentUuid.entries()) {
    childrenByParentUuid.set(
      parentUuid,
      sortEntityUuids(childUuids, entityByUuid)
    );
  }

  function buildNode(
    uuid: string,
    depth: number,
    visited: Set<string>
  ): SystemTreeNode | null {
    if (visited.has(uuid)) {
      return null;
    }

    const entity = entityByUuid.get(uuid);
    if (!entity) {
      return null;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(uuid);

    const node: SystemTreeNode = {
      uuid,
      entity,
      parentUuid: getNormalizedParentUuid(entity, entityByUuid),
      children: [],
      depth,
    };

    nodesByUuid.set(uuid, node);

    const childUuids = childrenByParentUuid.get(uuid) ?? [];

    node.children = childUuids
      .map((childUuid) => buildNode(childUuid, depth + 1, nextVisited))
      .filter((child): child is SystemTreeNode => child !== null);

    return node;
  }

  const rootUuids = childrenByParentUuid.get(null) ?? [];

  const roots = rootUuids
    .map((uuid) => buildNode(uuid, 0, new Set<string>()))
    .filter((node): node is SystemTreeNode => node !== null);

  for (const entity of entities) {
    if (nodesByUuid.has(entity.uuid)) continue;

    const fallbackNode: SystemTreeNode = {
      uuid: entity.uuid,
      entity,
      parentUuid: null,
      children: [],
      depth: 0,
    };

    nodesByUuid.set(entity.uuid, fallbackNode);
    roots.push(fallbackNode);
  }

  return {
    roots,
    nodesByUuid,
    childrenByParentUuid,
    entityByUuid,
  };
}

export function getDescendantUuids(
  uuid: string,
  entities: CanvasEntity[]
): Set<string> {
  const tree = buildSystemTree(entities);
  const result = new Set<string>();

  function visit(currentUuid: string) {
    const node = tree.nodesByUuid.get(currentUuid);
    if (!node) return;

    for (const child of node.children) {
      if (result.has(child.uuid)) continue;

      result.add(child.uuid);
      visit(child.uuid);
    }
  }

  visit(uuid);

  return result;
}

export function getSubtreeUuids(
  uuid: string,
  entities: CanvasEntity[]
): Set<string> {
  const result = getDescendantUuids(uuid, entities);
  result.add(uuid);
  return result;
}

export function getAncestorUuids(
  uuid: string,
  entities: CanvasEntity[]
): Set<string> {
  const entityByUuid = new Map<string, CanvasEntity>(
    entities.map((entity) => [entity.uuid, entity])
  );
  const result = new Set<string>();
  const visited = new Set<string>();

  let current = entityByUuid.get(uuid) ?? null;

  while (current) {
    const parentUuid = getNormalizedParentUuid(current, entityByUuid);

    if (!parentUuid || visited.has(parentUuid)) {
      break;
    }

    visited.add(parentUuid);
    result.add(parentUuid);

    current = entityByUuid.get(parentUuid) ?? null;
  }

  return result;
}

export function wouldCreateCircularParent(
  entityUuid: string,
  nextParentUuid: string | null,
  entities: CanvasEntity[]
): boolean {
  if (!nextParentUuid) return false;

  if (entityUuid === nextParentUuid) {
    return true;
  }

  const descendants = getDescendantUuids(entityUuid, entities);
  return descendants.has(nextParentUuid);
}
