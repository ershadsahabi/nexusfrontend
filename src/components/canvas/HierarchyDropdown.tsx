// src/components/canvas/HierarchyDropdown.tsx

'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Circle,
  Network,
  RotateCcw,
  Target,
} from 'lucide-react';

import { useCanvasStore } from '@/store/useCanvasStore';
import { buildChildrenMap, buildEntityMap } from '@/lib/graph/systemTree';

import styles from './controls.module.css';

type EntityLike = {
  uuid: string;
  name: string;
};

type HierarchyNodeProps = {
  uuid: string;
  level: number;
  childrenMap: Map<string, EntityLike[]>;
  entityMap: Map<string, EntityLike>;
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
        style={{ paddingRight: `${level * 16}px` }}
        onClick={() => setFocusEntity(uuid)}
        title={entity.name}
      >
        <button
          type="button"
          className={styles.nodeToggleButton}
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) setExpanded((prev) => !prev);
          }}
          aria-label={hasChildren ? 'باز و بسته کردن شاخه' : 'گره بدون فرزند'}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />
          ) : (
            <Circle size={4} className={styles.nodeDot} />
          )}
        </button>

        <div className={styles.nodeLabel}>
          <span className={styles.nodeName}>{entity.name}</span>

          {isFocused && (
            <span className={styles.nodeFocusBadge}>
              <Target size={11} />
              فوکوس
            </span>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className={styles.nodeChildren}>
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

  if (!activeRootSystemUuid) {
    return (
      <div className={styles.hierarchyEmptyState} dir="rtl">
        <div className={styles.hierarchyEmptyIcon}>
          <Network size={18} />
        </div>

        <div className={styles.hierarchyEmptyTitle}>درخت ساختار آماده نیست</div>

        <div className={styles.hierarchyEmptyText}>
          برای مشاهده سلسله‌مراتب، ابتدا یک سیستم ریشه انتخاب کنید.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hierarchyPanel} dir="rtl">
      <div className={styles.hierarchyHeader}>
        <div className={styles.hierarchyTitle}>
          <Network size={16} />
          <span>سلسله‌مراتب سیستم</span>
        </div>

        {focusEntityUuid ? (
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => setFocusEntity(null)}
            title="بازنشانی فوکوس"
          >
            <RotateCcw size={12} />
            <span>بازنشانی</span>
          </button>
        ) : (
          <span className={styles.hierarchyHeaderHint}>انتخاب یک نود، فوکوس را فعال می‌کند</span>
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
