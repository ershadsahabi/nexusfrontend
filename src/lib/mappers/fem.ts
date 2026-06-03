// src/lib/mappers/fem.ts

import type { ApiFemModel, ApiFemStatus } from '@/lib/types/api.types';
import type {
  CanvasFemModel,
  CanvasFemStatus,
} from '@/lib/types/canvas.types';

export function mapApiFemStatusToCanvas(
  input: ApiFemStatus
): CanvasFemStatus {
  return {
    systemEntityUuid: input.system_entity_uuid,
    systemEntityCode: input.system_entity_code,
    systemEntityName: input.system_entity_name,

    systemTypeUuid: input.system_type_uuid,
    systemTypeName: input.system_type_name,

    femEligible: input.fem_eligible,
    hasFemModel: input.has_fem_model,

    femModelUuid: input.fem_model_uuid,
    femModelId: input.fem_model_id,

    entityType: input.entity_type,
  };
}

export function mapApiFemStatusesToCanvas(
  input: ApiFemStatus[]
): CanvasFemStatus[] {
  return input.map(mapApiFemStatusToCanvas);
}

export function mapApiFemModelToCanvas(
  input: ApiFemModel
): CanvasFemModel {
  return {
    id: input.id,
    uuid: input.uuid,

    projectUuid: input.project,

    systemEntityUuid: input.system_entity.uuid,
    systemEntityCode: input.system_entity.code,
    systemEntityName: input.system_entity.name,
    systemEntityType: input.system_entity.entity_type,

    systemTypeUuid: input.system_entity.system_type_uuid,
    systemTypeName: input.system_entity.system_type_name,

    femEligible: input.system_entity.fem_eligible,

    metadata: input.metadata ?? {},
  };
}
