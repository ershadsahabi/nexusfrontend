// src/lib/metadata/types.ts

export type MetadataPrimitiveType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'select';

export interface MetadataSchemaOption {
  label?: string;
  value: string | number | boolean;
}

export interface MetadataSchemaField {
  type: MetadataPrimitiveType;
  label?: string;
  description?: string;
  placeholder?: string;

  unit?: string;
  group?: string;

  min?: number;
  max?: number;
  step?: number;

  required?: boolean;
  readonly?: boolean;

  options?: Array<string | number | boolean | MetadataSchemaOption>;
}

export type MetadataSchema = Record<string, MetadataSchemaField>;

export interface MetadataConfig {
  schema: MetadataSchema;
  defaults: Record<string, unknown>;
}

export type MetadataValues = Record<string, unknown>;

export interface MetadataFieldGroup {
  name: string;
  fields: Array<{
    key: string;
    field: MetadataSchemaField;
  }>;
}
