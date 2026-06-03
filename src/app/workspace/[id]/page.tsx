// src/app/workspace/[id]/page.tsx

'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import WorkspaceCanvas from '@/components/canvas/WorkspaceCanvas';

export default function ScenarioWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectUuid =
    typeof params?.id === 'string' ? params.id : String(params?.id ?? '');

  const scenarioId =
    searchParams.get('scenarioId') ??
    searchParams.get('scenarioUuid') ??
    undefined;

  return (
    <WorkspaceLayout projectUuid={projectUuid} scenarioId={scenarioId}>
      <WorkspaceCanvas projectUuid={projectUuid} scenarioId={scenarioId} />
    </WorkspaceLayout>
  );
}
