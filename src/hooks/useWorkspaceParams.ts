// src/hooks/useWorkspaceParams.ts

'use client';

import { useParams } from 'next/navigation';

interface WorkspaceParams {
  projectUuid: string;
  scenarioId: string;
}

export function useWorkspaceParams(): WorkspaceParams {
  const params = useParams();

  return {
    projectUuid: String(params.projectUuid),
    scenarioId: String(params.scenarioId),
  };
}
