// src/lib/api/designSectionOutputs.ts

import { apiClient } from './axios';

export type GenerateDesignSectionOutputPayload = {
  project_uuid: string;
  workspace_uuid: string;
  system_entity_uuid: string;
  design_model_uuid?: string | null;
  station_ratio?: number;
  station?: number | null;
  section_assignment?: number | null;
  name?: string;
  notes?: string;
};

export type SaveDraftDesignSectionOutputPayload = {
  project_uuid: string;
  workspace_uuid: string;
  system_entity_uuid: string;
  design_model_uuid?: string | null;
  station_ratio?: number;
  station?: number | null;
  section_assignment?: number | null;
  name?: string;
  notes?: string;
  section_kind?: string;
  section_label?: string;
  dimensions?: Record<string, unknown>;
  material?: Record<string, unknown>;
};

export type DesignSectionOutputStatus =
  | 'draft'
  | 'generated'
  | 'approved'
  | 'archived'
  | string;

export type ApiDesignSectionOutput = {
  id: number;
  project: number;
  design_model: number;
  structural_entity: number;
  station: number | null;
  section_assignment: number | null;
  station_ratio: number;
  revision: number;
  name: string;
  status: DesignSectionOutputStatus;
  section_kind: string;
  section_label: string;
  dimensions: Record<string, unknown>;
  material: Record<string, unknown>;
  source_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown>;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

function parseAxiosError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    const response = error.response as {
      data?: unknown;
      status?: number;
    };

    const data = response.data;

    if (typeof data === 'string') return data;

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;

      if (typeof record.detail === 'string') {
        return record.detail;
      }

      const firstKey = Object.keys(record)[0];
      if (firstKey) {
        const value = record[firstKey];

        if (Array.isArray(value)) {
          return `${firstKey}: ${value.join(' ')}`;
        }

        if (value && typeof value === 'object') {
          return `${firstKey}: ${JSON.stringify(value)}`;
        }

        return `${firstKey}: ${String(value)}`;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'خطای نامشخص در ذخیره خروجی مقطع FEM.';
}

export async function generateDesignSectionOutput(
  payload: GenerateDesignSectionOutputPayload
): Promise<ApiDesignSectionOutput> {
  try {
    const response = await apiClient.post<ApiDesignSectionOutput>(
      '/design/section-outputs/generate/',
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(parseAxiosError(error));
  }
}

export async function saveDraftDesignSectionOutput(
  payload: SaveDraftDesignSectionOutputPayload
): Promise<ApiDesignSectionOutput> {
  try {
    const response = await apiClient.post<ApiDesignSectionOutput>(
      '/design/section-outputs/save-draft/',
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(parseAxiosError(error));
  }
}
