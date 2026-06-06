// src/lib/workspace/workspace-ui.ts

import type { WorkspaceType } from '@/lib/types/workspace.types';

export function getWorkspaceDisplayName(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'FEM';
    case 'CAD':
      return 'CAD';
    default:
      return workspaceType;
  }
}

export function getWorkspaceTitle(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'Workspace نوع FEM';
    case 'CAD':
      return 'Workspace نوع CAD';
    default:
      return 'Workspace';
  }
}

export function getWorkspaceCreateLabel(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'ایجاد Workspace FEM';
    case 'CAD':
      return 'ایجاد Workspace CAD';
    default:
      return 'ایجاد Workspace';
  }
}

export function getWorkspaceConnectLabel(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'اتصال FEM';
    case 'CAD':
      return 'اتصال CAD';
    default:
      return 'اتصال Workspace';
  }
}

export function getWorkspaceOpenLabel(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'ورود به FEM';
    case 'CAD':
      return 'ورود به CAD';
    default:
      return 'ورود به Workspace';
  }
}

export function getWorkspaceEligibilityLabel(workspaceType: WorkspaceType): string {
  switch (workspaceType) {
    case 'FEM':
      return 'FEM Eligibility';
    case 'CAD':
      return 'CAD Eligibility';
    default:
      return 'Workspace Eligibility';
  }
}
