// src/components/metadata/MetadataForm.tsx

'use client';

import type { MetadataSchema, MetadataValues } from '@/lib/metadata/types';
import {
  getMetadataGroups,
  getOptionLabel,
  getOptionValue,
  normalizeMetadataValueByField,
} from '@/lib/metadata/utils';

import styles from './MetadataForm.module.css';

type Props = {
  schema: MetadataSchema;
  values: MetadataValues;
  onChange: (values: MetadataValues) => void;
  disabled?: boolean;
  title?: string;
  emptyMessage?: string;
};

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function MetadataForm({
  schema,
  values,
  onChange,
  disabled = false,
  title,
  emptyMessage = 'برای این تیپ، فیلد متادیتایی تعریف نشده است.',
}: Props) {
  const groups = getMetadataGroups(schema);

  const handleFieldChange = (key: string, nextValue: unknown) => {
    onChange({
      ...values,
      [key]: nextValue,
    });
  };

  if (!schema || Object.keys(schema).length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.wrapper}>
      {title ? <div className={styles.formTitle}>{title}</div> : null}

      {groups.map((group) => (
        <section key={group.name} className={styles.groupCard}>
          <div className={styles.groupHeader}>
            <h4>{group.name}</h4>
          </div>

          <div className={styles.groupGrid}>
            {group.fields.map(({ key, field }) => {
              const value = values?.[key];

              const label = field.label ?? key;
              const unit = field.unit;
              const description = field.description;

              if (field.type === 'number' || field.type === 'integer') {
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      <span>{label}</span>
                      {unit ? <span className={styles.unit}>{unit}</span> : null}
                    </label>

                    <input
                      type="number"
                      value={value ?? ''}
                      min={field.min}
                      max={field.max}
                      step={
                        field.step ??
                        (field.type === 'integer' ? 1 : 'any')
                      }
                      disabled={disabled || field.readonly}
                      placeholder={field.placeholder}
                      className={styles.input}
                      onChange={(e) =>
                        handleFieldChange(
                          key,
                          normalizeMetadataValueByField(field, e.target.value)
                        )
                      }
                    />

                    {description ? (
                      <div className={styles.description}>{description}</div>
                    ) : null}
                  </div>
                );
              }

              if (field.type === 'boolean') {
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        disabled={disabled || field.readonly}
                        onChange={(e) =>
                          handleFieldChange(key, e.target.checked)
                        }
                      />
                      <span className={styles.labelInline}>{label}</span>
                    </label>

                    {description ? (
                      <div className={styles.description}>{description}</div>
                    ) : null}
                  </div>
                );
              }

              if (field.type === 'select') {
                return (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      <span>{label}</span>
                    </label>

                    <select
                      value={(value as any) ?? ''}
                      disabled={disabled || field.readonly}
                      className={styles.select}
                      onChange={(e) =>
                        handleFieldChange(key, e.target.value)
                      }
                    >
                      <option value="">انتخاب کنید...</option>

                      {(field.options ?? []).map((option, idx) => {
                        const optionValue = getOptionValue(option);
                        const optionLabel = getOptionLabel(option);

                        return (
                          <option key={`${key}-${idx}`} value={String(optionValue)}>
                            {optionLabel}
                          </option>
                        );
                      })}
                    </select>

                    {description ? (
                      <div className={styles.description}>{description}</div>
                    ) : null}
                  </div>
                );
              }

              return (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>
                    <span>{label}</span>
                    {unit ? <span className={styles.unit}>{unit}</span> : null}
                  </label>

                  <input
                    type="text"
                    value={String(value ?? '')}
                    disabled={disabled || field.readonly}
                    placeholder={field.placeholder}
                    className={styles.input}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                  />

                  {description ? (
                    <div className={styles.description}>{description}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
