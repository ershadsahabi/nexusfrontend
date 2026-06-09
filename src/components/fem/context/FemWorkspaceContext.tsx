// src/components/fem/context/FemWorkspaceContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchEntityWorkspace } from '@/lib/api/workspaces';
import { mapApiEntityWorkspaceToCanvas } from '@/lib/mappers/workspace';
import type { CanvasEntityWorkspace } from '@/lib/types/workspace.types';

interface FemWorkspaceContextType {
  workspace: CanvasEntityWorkspace | null;
  isLoading: boolean;
  error: string | null;
}

const FemWorkspaceContext = createContext<FemWorkspaceContextType | undefined>(undefined);

export function FemWorkspaceProvider({ 
  children, 
  projectUuid, 
  workspaceUuid 
}: { 
  children: React.ReactNode;
  projectUuid: string;
  workspaceUuid: string;
}) {
  const [workspace, setWorkspace] = useState<CanvasEntityWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setIsLoading(true);
        const data = await fetchEntityWorkspace(projectUuid, workspaceUuid);
        setWorkspace(mapApiEntityWorkspaceToCanvas(data));
      } catch (err) {
        setError('خطا در بارگذاری ورک‌اسپیس');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, [projectUuid, workspaceUuid]);

  return (
    <FemWorkspaceContext.Provider value={{ workspace, isLoading, error }}>
      {children}
    </FemWorkspaceContext.Provider>
  );
}

export const useFemWorkspace = () => {
  const context = useContext(FemWorkspaceContext);
  if (!context) throw new Error('useFemWorkspace must be used within FemWorkspaceProvider');
  return context;
};
