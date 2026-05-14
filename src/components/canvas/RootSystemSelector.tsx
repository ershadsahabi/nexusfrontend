// src/components/canvas/RootSystemSelector.tsx

'use client';

import { useMemo } from 'react';

import { useCanvasStore } from '@/store/useCanvasStore';

import {
  findRootSystems,
} from '@/lib/graph/systemTree';

type Props = {
  className?: string;
};

export default function RootSystemSelector({
  className,
}: Props) {
  const entities = useCanvasStore(
    (s) => s.entities
  );

  const activeRootSystemUuid =
    useCanvasStore(
      (s) => s.activeRootSystemUuid
    );

  const setActiveRootSystem =
    useCanvasStore(
      (s) => s.setActiveRootSystem
    );

  const roots = useMemo(() => {
    return findRootSystems(entities);
  }, [entities]);

  return (
    <select
      className={className}
      value={
        activeRootSystemUuid ?? ''
      }
      onChange={(e) =>
        setActiveRootSystem(
          e.target.value || null
        )
      }
    >
      <option value="">
        All Systems
      </option>

      {roots.map((root) => (
        <option
          key={root.uuid}
          value={root.uuid}
        >
          {root.name}
        </option>
      ))}
    </select>
  );
}
