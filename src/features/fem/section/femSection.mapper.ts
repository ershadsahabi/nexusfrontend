// src/features/fem/section/femSection.mapper.ts


import type { CanvasEntity } from '@/lib/types/canvas.types';
import type { ApiEntityWorkspace } from '@/lib/types/workspace.types';

import type {
  FemSectionDimensions,
  FemSectionKind,
  FemSectionMaterial,
  FemSectionModel,
  FemSectionUnit,
} from './femSection.types';

import {
  asRecord,
  getFemSectionCandidate,
  getFirstNumber,
  getString,
  normalizeSectionKind,
} from './femSectionMetadata.reader';

function normalizeKind(value: unknown): FemSectionKind {
  const normalized = normalizeSectionKind(value);

  if (
    normalized === 'rectangular' ||
    normalized === 'box' ||
    normalized === 'box_culvert' ||
    normalized === 'circular' ||
    normalized === 'cylinder' ||
    normalized === 'i_shape'
  ) {
    return normalized;
  }

  return 'unknown';
}

function normalizeMaterial(value: unknown): FemSectionMaterial {
  const raw = asRecord(value);

  return {
    type: getString(raw.type),
    grade: getString(raw.grade),
    color: getString(raw.color),
    variant: getString(raw.variant),
  };
}

function normalizeUnits(value: unknown): FemSectionUnit {
  return getString(value) ?? 'm';
}

function readDimensions(raw: Record<string, unknown>): FemSectionDimensions {
  const dimensions = asRecord(raw.dimensions);

  const source = {
    ...raw,
    ...dimensions,
  };

  const width = getFirstNumber(
    [
      source.width,
      source.b,
      source.section_width,
      source.sectionWidth,
      source.flangeWidth,
      source.flange_width,
    ],
    1
  );

  const height = getFirstNumber(
    [
      source.height,
      source.h,
      source.depth,
      source.section_height,
      source.sectionHeight,
    ],
    1
  );

  const diameter = getFirstNumber(
    [source.diameter, source.d, source.outerDiameter, source.outer_diameter],
    Math.max(width, height)
  );

  const radius = getFirstNumber(
    [source.radius, source.r],
    diameter / 2
  );

  const thickness = getFirstNumber(
    [
      source.thickness,
      source.wallThickness,
      source.wall_thickness,
      source.t,
    ],
    Math.min(width, height) * 0.08
  );

  const flangeWidth = getFirstNumber(
    [source.flangeWidth, source.flange_width, source.bf],
    width
  );

  const flangeThickness = getFirstNumber(
    [source.flangeThickness, source.flange_thickness, source.tf],
    Math.max(height * 0.08, 0.01)
  );

  const webThickness = getFirstNumber(
    [source.webThickness, source.web_thickness, source.tw],
    Math.max(width * 0.06, 0.01)
  );

  return {
    width,
    height,
    depth: getFirstNumber([source.depth, source.length], height),
    length: getFirstNumber([source.length, source.depth], 1),
    thickness,
    wallThickness: thickness,
    diameter,
    radius,
    flangeWidth,
    flangeThickness,
    webThickness,
  };
}

function getDefaultKindFromVisual(entity: CanvasEntity): FemSectionKind {
  const renderer = normalizeSectionKind(entity.systemType?.visual_definition?.renderer);
  const shapeKey = normalizeSectionKind(entity.systemType?.shape_key);

  const candidate = renderer ?? shapeKey;

  if (candidate === 'box_culvert') return 'box_culvert';
  if (candidate === 'cylinder') return 'circular';
  if (candidate === 'box') return 'rectangular';

  return 'rectangular';
}

function buildLabel(entity: CanvasEntity, kind: FemSectionKind) {
  const code = entity.code?.trim();
  const name = entity.name?.trim();

  if (code && name) return `${code} - ${name}`;
  if (code) return code;
  if (name) return name;

  return kind === 'unknown' ? 'Unknown Section' : `${kind} section`;
}

export function mapEntityToFemSectionModel(
  entity: CanvasEntity,
  workspace: ApiEntityWorkspace
): FemSectionModel {
  const candidate = getFemSectionCandidate(entity);
  const raw = candidate.value;

  const explicitKind =
    raw.kind ??
    raw.type ??
    raw.section_type ??
    raw.sectionType ??
    raw.shape ??
    raw.renderer;

  const kind =
    normalizeKind(explicitKind) === 'unknown'
      ? getDefaultKindFromVisual(entity)
      : normalizeKind(explicitKind);

  const dimensions = readDimensions(raw);
  const material = normalizeMaterial(
    raw.material ?? entity.systemType?.visual_definition?.material
  );

  return {
    kind,
    label: buildLabel(entity, kind),
    source: candidate.source,
    units: normalizeUnits(raw.units ?? raw.unit),
    dimensions: {
      ...dimensions,
      width: dimensions.width ?? 1,
      height: dimensions.height ?? 1,
    },
    material,
    raw,
    entity,
    workspace,
  };
}
