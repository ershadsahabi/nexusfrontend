// src/app/workspace/[id]/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';

import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import WorkspaceCanvas from '@/components/canvas/WorkspaceCanvas';

export default function ScenarioWorkspacePage() {
  const params = useParams();

  const projectUuid = String(params?.id);
  const scenarioId =
    typeof params?.scenarioId === 'string'
      ? params.scenarioId
      : undefined;

  return (
    <WorkspaceLayout>
      <WorkspaceCanvas
        projectUuid={projectUuid}
        scenarioId={scenarioId}
      />
    </WorkspaceLayout>
  );
}
