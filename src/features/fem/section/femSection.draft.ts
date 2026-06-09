// src/features/fem/section/femSection.draft.ts


import type {
  FemSectionDraft,
  FemSectionDimensions,
  FemSectionModel,
} from './femSection.types';

function normalizePositive(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function createFemSectionDraft(section: FemSectionModel): FemSectionDraft {
  return {
    kind: section.kind,
    label: section.label,
    units: section.units,
    material: {
      ...section.material,
    },
    dimensions: {
      ...section.dimensions,
      width: normalizePositive(section.dimensions.width, 1),
      height: normalizePositive(section.dimensions.height, 1),
      thickness: normalizePositive(
        section.dimensions.thickness ?? section.dimensions.wallThickness,
        Math.min(
          normalizePositive(section.dimensions.width, 1),
          normalizePositive(section.dimensions.height, 1)
        ) * 0.08
      ),
      diameter: normalizePositive(
        section.dimensions.diameter,
        Math.max(
          normalizePositive(section.dimensions.width, 1),
          normalizePositive(section.dimensions.height, 1)
        )
      ),
      radius: normalizePositive(
        section.dimensions.radius,
        normalizePositive(section.dimensions.diameter, 1) / 2
      ),
      flangeWidth: normalizePositive(
        section.dimensions.flangeWidth ?? section.dimensions.width,
        normalizePositive(section.dimensions.width, 1)
      ),
      flangeThickness: normalizePositive(
        section.dimensions.flangeThickness,
        Math.max(normalizePositive(section.dimensions.height, 1) * 0.08, 0.01)
      ),
      webThickness: normalizePositive(
        section.dimensions.webThickness,
        Math.max(normalizePositive(section.dimensions.width, 1) * 0.06, 0.01)
      ),
    },
  };
}

export function patchFemSectionDimensions(
  current: FemSectionDraft,
  patch: Partial<FemSectionDimensions>
): FemSectionDraft {
  const nextDimensions = {
    ...current.dimensions,
    ...patch,
  };

  if (
    current.kind === 'circular' ||
    current.kind === 'cylinder'
  ) {
    const diameter = normalizePositive(
      nextDimensions.diameter ?? (nextDimensions.radius ? nextDimensions.radius * 2 : undefined),
      Math.max(
        normalizePositive(nextDimensions.width, 1),
        normalizePositive(nextDimensions.height, 1)
      )
    );

    nextDimensions.diameter = diameter;
    nextDimensions.radius = diameter / 2;
    nextDimensions.width = diameter;
    nextDimensions.height = diameter;
  }

  if (current.kind === 'box_culvert') {
    const width = normalizePositive(nextDimensions.width, 1);
    const height = normalizePositive(nextDimensions.height, 1);
    const thickness = normalizePositive(
      nextDimensions.thickness ?? nextDimensions.wallThickness,
      Math.min(width, height) * 0.08
    );

    nextDimensions.width = width;
    nextDimensions.height = height;
    nextDimensions.thickness = thickness;
    nextDimensions.wallThickness = thickness;
  }

  if (current.kind === 'i_shape') {
    const width = normalizePositive(nextDimensions.width, 1);
    const height = normalizePositive(nextDimensions.height, 1);

    nextDimensions.width = width;
    nextDimensions.height = height;
    nextDimensions.flangeWidth = normalizePositive(
      nextDimensions.flangeWidth,
      width
    );
    nextDimensions.flangeThickness = normalizePositive(
      nextDimensions.flangeThickness,
      Math.max(height * 0.08, 0.01)
    );
    nextDimensions.webThickness = normalizePositive(
      nextDimensions.webThickness,
      Math.max(width * 0.06, 0.01)
    );
  }

  return {
    ...current,
    dimensions: nextDimensions,
  };
}
