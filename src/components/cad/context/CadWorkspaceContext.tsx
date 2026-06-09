// src/components/cad/context/CadWorkspaceContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchEntityWorkspace } from '@/lib/api/workspaces';
import { mapApiEntityWorkspaceToCanvas } from '@/lib/mappers/workspace';
import type { CanvasEntityWorkspace } from '@/lib/types/workspace.types';

type CadWorkspaceContextType = {
  workspace: CanvasEntityWorkspace | null;
  isLoading: boolean;
  error: string | null;
  title: string;
  shortUuid: string;
};

const CadWorkspaceContext = createContext<CadWorkspaceContextType | undefined>(undefined);

export function CadWorkspaceProvider({
  children,
  projectUuid,
  workspaceUuid,
}: {
  children: React.ReactNode;
  projectUuid: string;
  workspaceUuid: string;
}) {
  const [workspace, setWorkspace] = useState<CanvasEntityWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchEntityWorkspace(projectUuid, workspaceUuid);
        const mapped = mapApiEntityWorkspaceToCanvas(data);

        if (mapped.workspaceType !== 'CAD') {
          throw new Error('Loaded workspace is not CAD');
        }

        if (isMounted) {
          setWorkspace(mapped);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setWorkspace(null);
          setError('خطا در بارگذاری محیط CAD');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [projectUuid, workspaceUuid]);

  const value = useMemo<CadWorkspaceContextType>(() => {
    const title =
      workspace?.systemEntityName ||
      workspace?.systemEntityCode ||
      'CAD Workspace';

    return {
      workspace,
      isLoading,
      error,
      title,
      shortUuid: workspace?.uuid ? workspace.uuid.slice(0, 8) : workspaceUuid.slice(0, 8),
    };
  }, [error, isLoading, workspace, workspaceUuid]);

  return (
    <CadWorkspaceContext.Provider value={value}>
      {children}
    </CadWorkspaceContext.Provider>
  );
}

export function useCadWorkspace() {
  const context = useContext(CadWorkspaceContext);

  if (!context) {
    throw new Error('useCadWorkspace must be used within CadWorkspaceProvider');
  }

  return context;
}
