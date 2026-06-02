// src/components/canvas/RootSystemSelector.tsx

'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

import { useCanvasStore } from '@/store/useCanvasStore';
import { findRootSystems } from '@/lib/graph/systemTree';
import FloatingPanel from '@/components/common/FloatingPanel/FloatingPanel';
import floatingStyles from '@/components/common/FloatingPanel/FloatingPanel.module.css';

import styles from './controls.module.css';

type Props = {
  className?: string;
};

export default function RootSystemSelector({ className = '' }: Props) {
  const entities = useCanvasStore((s) => s.entities);
  const activeRootSystemUuid = useCanvasStore((s) => s.activeRootSystemUuid);
  const setActiveRootSystem = useCanvasStore((s) => s.setActiveRootSystem);

  const [isOpen, setIsOpen] = useState(false);

  const roots = useMemo(() => findRootSystems(entities), [entities]);

  const activeRoot = roots.find((root) => root.uuid === activeRootSystemUuid);
  const displayLabel = activeRoot ? activeRoot.name : 'همه سیستم‌ها (نمای کلی)';

  const handleSelect = (uuid: string | null) => {
    setActiveRootSystem(uuid);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.customSelectContainer} ${className}`} dir="rtl">
      <FloatingPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom-end"
        offsetValue={8}
        matchTriggerWidth
        className={`${styles.selectDropdown} ${floatingStyles.panel}`}
        trigger={
          <button
            type="button"
            className={`${styles.selectTrigger} ${isOpen ? styles.selectTriggerActive : ''}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={styles.selectTriggerLabel} title={displayLabel}>
              {displayLabel}
            </span>

            <ChevronDown
              size={16}
              className={styles.selectChevron}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        }
      >
        <div className={styles.selectList} role="listbox" aria-label="انتخاب سیستم ریشه">
          <button
            type="button"
            className={`${styles.selectOption} ${!activeRootSystemUuid ? styles.selectOptionSelected : ''}`}
            onClick={() => handleSelect(null)}
          >
            <span className={styles.selectOptionLabel}>همه سیستم‌ها (نمای کلی)</span>
            {!activeRootSystemUuid && <Check size={15} className={styles.selectOptionIcon} />}
          </button>

          {roots.map((root) => {
            const selected = activeRootSystemUuid === root.uuid;

            return (
              <button
                key={root.uuid}
                type="button"
                className={`${styles.selectOption} ${selected ? styles.selectOptionSelected : ''}`}
                onClick={() => handleSelect(root.uuid)}
              >
                <span className={styles.selectOptionLabel}>{root.name}</span>
                {selected && <Check size={15} className={styles.selectOptionIcon} />}
              </button>
            );
          })}
        </div>
      </FloatingPanel>
    </div>
  );
}
