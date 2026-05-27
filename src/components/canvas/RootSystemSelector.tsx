// src/components/canvas/RootSystemSelector.tsx

'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { findRootSystems } from '@/lib/graph/systemTree';
import styles from './controls.module.css';

type Props = {
  className?: string;
};

export default function RootSystemSelector({ className = '' }: Props) {
  const entities = useCanvasStore((s) => s.entities);
  const activeRootSystemUuid = useCanvasStore((s) => s.activeRootSystemUuid);
  const setActiveRootSystem = useCanvasStore((s) => s.setActiveRootSystem);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roots = useMemo(() => {
    return findRootSystems(entities);
  }, [entities]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (uuid: string | null) => {
    setActiveRootSystem(uuid);
    setIsOpen(false);
  };

  const activeRoot = roots.find(r => r.uuid === activeRootSystemUuid);
  const displayLabel = activeRoot ? activeRoot.name : 'همه سیستم‌ها (نمای کلی)';

  return (
    <div className={`${styles.customSelectContainer} ${styles.smartFade} ${className}`} dir="rtl" ref={dropdownRef}>
      <div 
        className={`${styles.selectTrigger} ${isOpen ? styles.selectTriggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayLabel}</span>
        <ChevronDown 
          size={16} 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} 
        />
      </div>

      {isOpen && (
        <div className={styles.selectDropdown}>
          <div 
            className={`${styles.selectOption} ${!activeRootSystemUuid ? styles.selectOptionSelected : ''}`}
            onClick={() => handleSelect(null)}
          >
            <span>همه سیستم‌ها (نمای کلی)</span>
            {!activeRootSystemUuid && <Check size={16} />}
          </div>
          
          {roots.map((root) => (
            <div 
              key={root.uuid} 
              className={`${styles.selectOption} ${activeRootSystemUuid === root.uuid ? styles.selectOptionSelected : ''}`}
              onClick={() => handleSelect(root.uuid)}
            >
              <span>{root.name}</span>
              {activeRootSystemUuid === root.uuid && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
