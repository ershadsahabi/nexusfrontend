// src/app/projects/[projectId]/[workspaceType]/[workspaceUuid]/page.tsx

'use client';

import { use } from 'react';

import CadWorkspaceShell from '@/components/cad/CadWorkspaceShell';
import FemWorkspaceShell from '@/components/fem/FemWorkspaceShell';
import { workspaceSlugToType } from '@/lib/types/workspace.types';
import type { WorkspaceType } from '@/lib/types/workspace.types';

type PageParams = {
  projectId: string;
  workspaceType: string;
  workspaceUuid: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export default function EntityWorkspacePage({ params }: PageProps) {
  const { projectId, workspaceType, workspaceUuid } = use(params);
  const resolvedWorkspaceType = resolveWorkspaceType(workspaceType);

  if (!resolvedWorkspaceType) {
    return (
      <WorkspaceFallback
        badge="INVALID WORKSPACE"
        title="Workspace نامعتبر است"
        description="نوع Workspace در مسیر معتبر نیست. لطفا از مسیر معتبر FEM یا CAD استفاده کنید."
        workspaceType={workspaceType}
        workspaceUuid={workspaceUuid}
        tone="error"
      />
    );
  }

  if (resolvedWorkspaceType === 'FEM') {
    return (
      <FemWorkspaceShell
        projectUuid={projectId}
        workspaceUuid={workspaceUuid}
      />
    );
  }

  if (resolvedWorkspaceType === 'CAD') {
    return (
      <CadWorkspaceShell
        projectUuid={projectId}
        workspaceUuid={workspaceUuid}
      />
    );
  }

  return (
    <WorkspaceFallback
      badge="COMING SOON"
      title={`Workspace نوع ${resolvedWorkspaceType}`}
      description="این نوع Workspace در قرارداد API معتبر است، اما Shell اختصاصی آن هنوز در فرانت‌اند پیاده‌سازی نشده است."
      workspaceType={resolvedWorkspaceType}
      workspaceUuid={workspaceUuid}
      tone="info"
    />
  );
}

function resolveWorkspaceType(value: string): WorkspaceType | null {
  try {
    return workspaceSlugToType(value);
  } catch {
    return null;
  }
}

function WorkspaceFallback({
  badge,
  title,
  description,
  workspaceType,
  workspaceUuid,
  tone,
}: {
  badge: string;
  title: string;
  description: string;
  workspaceType: string;
  workspaceUuid: string;
  tone: 'info' | 'error';
}) {
  const accentColor = tone === 'error' ? '#fb7185' : '#38bdf8';
  const accentBackground =
    tone === 'error'
      ? 'rgba(251, 113, 133, 0.12)'
      : 'rgba(56, 189, 248, 0.12)';
  const accentBorder =
    tone === 'error'
      ? 'rgba(251, 113, 133, 0.28)'
      : 'rgba(56, 189, 248, 0.28)';

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 34%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #020617 100%)',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
        padding: 32,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 620,
          border: '1px solid rgba(148, 163, 184, 0.22)',
          borderRadius: 24,
          padding: 28,
          background: 'rgba(15, 23, 42, 0.86)',
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.42)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: `1px solid ${accentBorder}`,
            borderRadius: 999,
            padding: '7px 11px',
            background: accentBackground,
            color: accentColor,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 18,
            direction: 'ltr',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: accentColor,
              boxShadow: `0 0 18px ${accentColor}`,
            }}
          />
          {badge}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 26,
            lineHeight: 1.5,
            fontWeight: 900,
            color: '#f8fafc',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: '12px 0 22px',
            color: '#94a3b8',
            lineHeight: 1.9,
            fontSize: 14,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          <WorkspaceMetaRow label="Workspace Type" value={workspaceType} />
          <WorkspaceMetaRow label="Workspace UUID" value={workspaceUuid} />
        </div>
      </section>
    </main>
  );
}

function WorkspaceMetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        border: '1px solid rgba(148, 163, 184, 0.14)',
        borderRadius: 16,
        padding: 14,
        background: 'rgba(2, 6, 23, 0.38)',
      }}
    >
      <span
        style={{
          color: '#64748b',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          direction: 'ltr',
          textAlign: 'left',
        }}
      >
        {label}
      </span>

      <code
        style={{
          color: '#bae6fd',
          fontSize: 12,
          lineHeight: 1.7,
          direction: 'ltr',
          textAlign: 'left',
          wordBreak: 'break-all',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {value}
      </code>
    </div>
  );
}
