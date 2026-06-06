// src/app/projects/[projectId]/[workspaceType]/[workspaceUuid]/page.tsx

'use client';

import FemWorkspaceShell from '@/components/fem/FemWorkspaceShell';
import { workspaceSlugToType } from '@/lib/types/workspace.types';

type PageProps = {
  params: {
    projectId: string;
    workspaceType: string;
    workspaceUuid: string;
  };
};

export default function EntityWorkspacePage({ params }: PageProps) {
  const workspaceType = workspaceSlugToType(params.workspaceType);

  if (workspaceType === 'FEM') {
    return (
      <FemWorkspaceShell
        projectUuid={params.projectId}
        femModelUuid={params.workspaceUuid}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: 18,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.9)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.16em',
            color: '#38bdf8',
            marginBottom: 10,
            textTransform: 'uppercase',
          }}
        >
          ENTITY WORKSPACE
        </div>

        <h1
          style={{
            fontSize: 22,
            marginBottom: 12,
          }}
        >
          Workspace نوع {workspaceType}
        </h1>

        <p
          style={{
            color: '#94a3b8',
            lineHeight: 1.9,
            marginBottom: 16,
          }}
        >
          مسیر عمومی Workspace فعال است. برای CAD هنوز Shell اختصاصی پیاده‌سازی
          نشده است.
        </p>

        <code
          style={{
            display: 'block',
            padding: 12,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 1)',
            color: '#bae6fd',
            direction: 'ltr',
            textAlign: 'left',
            wordBreak: 'break-all',
          }}
        >
          {params.workspaceUuid}
        </code>
      </div>
    </div>
  );
}
