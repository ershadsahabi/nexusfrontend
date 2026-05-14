// src/components/canvas/hierarchy/HierarchyNavigator.tsx

'use client';

import { useMemo } from 'react';

import { useCanvasStore } from '@/store/useCanvasStore';

import {
  buildChildrenMap,
  buildEntityMap,
} from '@/lib/graph/systemTree';

import styles from '../canvas.module.css';

type TreeNodeProps = {
  uuid: string;
  level: number;
  childrenMap: Map<string, any[]>;
  entityMap: Map<string, any>;
};

function TreeNode({
  uuid,
  level,
  childrenMap,
  entityMap,
}: TreeNodeProps) {
  const entity = entityMap.get(uuid);

  const focusEntityUuid = useCanvasStore(
    (s) => s.focusEntityUuid
  );

  const setFocusEntity = useCanvasStore(
    (s) => s.setFocusEntity
  );

  const viewDepth = useCanvasStore(
    (s) => s.viewDepth
  );

  const setViewDepth = useCanvasStore(
    (s) => s.setViewDepth
  );

  if (!entity) return null;

  const children =
    childrenMap.get(uuid) ?? [];

  const isFocused =
    focusEntityUuid === uuid;

  return (
    <div>
      <div
        className={
          isFocused
            ? styles.hierarchyNodeActive
            : styles.hierarchyNode
        }
        style={{
          paddingLeft: `${level * 14}px`,
        }}
      >
        <button
          className={styles.hierarchyFocusButton}
          onClick={() => {
            setFocusEntity(uuid);
          }}
          type="button"
        >
          {children.length > 0 ? '▸' : '•'}
        </button>

        <button
          className={styles.hierarchyLabel}
          onClick={() => {
            setFocusEntity(uuid);
          }}
          type="button"
        >
          {entity.name}
        </button>
      </div>

      {isFocused ? (
        <div
          className={styles.hierarchyDepthControls}
        >
          <button
            type="button"
            onClick={() =>
              setViewDepth(viewDepth - 1)
            }
          >
            −
          </button>

          <span>
            Depth {viewDepth}
          </span>

          <button
            type="button"
            onClick={() =>
              setViewDepth(viewDepth + 1)
            }
          >
            +
          </button>
        </div>
      ) : null}

      {children.map((child) => (
        <TreeNode
          key={child.uuid}
          uuid={child.uuid}
          level={level + 1}
          childrenMap={childrenMap}
          entityMap={entityMap}
        />
      ))}
    </div>
  );
}

export default function HierarchyNavigator() {
  const entities = useCanvasStore(
    (s) => s.entities
  );

  const activeRootSystemUuid =
    useCanvasStore(
      (s) => s.activeRootSystemUuid
    );

  const focusEntityUuid = useCanvasStore(
    (s) => s.focusEntityUuid
  );

  const setFocusEntity = useCanvasStore(
    (s) => s.setFocusEntity
  );

  const childrenMap = useMemo(() => {
    return buildChildrenMap(entities);
  }, [entities]);

  const entityMap = useMemo(() => {
    return buildEntityMap(entities);
  }, [entities]);

  if (!activeRootSystemUuid) {
    return null;
  }

  const rootEntity =
    entityMap.get(activeRootSystemUuid);

  if (!rootEntity) {
    return null;
  }

  return (
    <div className={styles.hierarchyNavigator}>
      <div className={styles.hierarchyHeader}>
        <div>
          Hierarchy
        </div>

        {focusEntityUuid ? (
          <button
            className={
              styles.hierarchyResetButton
            }
            onClick={() =>
              setFocusEntity(null)
            }
            type="button"
          >
            Reset Focus
          </button>
        ) : null}
      </div>

      <div className={styles.hierarchyTree}>
        <TreeNode
          uuid={activeRootSystemUuid}
          level={0}
          childrenMap={childrenMap}
          entityMap={entityMap}
        />
      </div>
    </div>
  );
}
