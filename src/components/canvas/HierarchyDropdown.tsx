// src/components/canvas/HierarchyDropdown.tsx

'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronDown, Circle, Network, RotateCcw } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { buildChildrenMap, buildEntityMap } from '@/lib/graph/systemTree';
import styles from './controls.module.css';

type HierarchyNodeProps = {
  uuid: string;
  level: number;
  childrenMap: Map<string, any[]>;
  entityMap: Map<string, any>;
};

function HierarchyNode({ uuid, level, childrenMap, entityMap }: HierarchyNodeProps) {
  const entity = entityMap.get(uuid);
  const focusEntityUuid = useCanvasStore((s) => s.focusEntityUuid);
  const setFocusEntity = useCanvasStore((s) => s.setFocusEntity);
  const children = childrenMap.get(uuid) ?? [];
  const [expanded, setExpanded] = useState(level < 1);

  if (!entity) return null;

  const isFocused = focusEntityUuid === uuid;
  const hasChildren = children.length > 0;

  return (
    <div className={styles.nodeWrapper}>
      <div
        className={`${styles.nodeItem} ${isFocused ? styles.nodeFocused : ''}`}
        style={{ paddingRight: `${level * 16}px` }} /* تو رفتگی برای حالت RTL */
      >
        <button
          type="button"
          className={styles.nodeToggleButton}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((prev) => !prev);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />
          ) : (
            <Circle size={4} style={{ opacity: 0.4 }} />
          )}
        </button>
        <div
          className={styles.nodeLabel}
          onClick={() => setFocusEntity(uuid)}
        >
          {entity.name}
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <HierarchyNode
              key={child.uuid}
              uuid={child.uuid}
              level={level + 1}
              childrenMap={childrenMap}
              entityMap={entityMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyDropdown() {
  const entities = useCanvasStore((s) => s.entities);
  const activeRootSystemUuid = useCanvasStore((s) => s.activeRootSystemUuid);
  const focusEntityUuid = useCanvasStore((s) => s.focusEntityUuid);
  const setFocusEntity = useCanvasStore((s) => s.setFocusEntity);

  const childrenMap = useMemo(() => buildChildrenMap(entities), [entities]);
  const entityMap = useMemo(() => buildEntityMap(entities), [entities]);

  if (!activeRootSystemUuid) return null;

  return (
    <div className={`${styles.hierarchyCard} ${styles.smartFade}`}  dir="rtl">
      <div className={styles.hierarchyHeader}>
        <div className={styles.hierarchyTitle}>
          <Network size={16} color="#38bdf8" />
          <span>سلسله‌مراتب سیستم</span>
        </div>
        
        {focusEntityUuid && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => setFocusEntity(null)}
            title="بازنشانی فوکوس"
          >
            <RotateCcw size={12} />
            بازنشانی
          </button>
        )}
      </div>
      
      <div className={styles.hierarchyTree}>
        <HierarchyNode
          uuid={activeRootSystemUuid}
          level={0}
          childrenMap={childrenMap}
          entityMap={entityMap}
        />
      </div>
    </div>
  );
}
