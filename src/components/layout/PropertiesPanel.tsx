// src/components/layout/PropertiesPanel.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';

import styles from './layout.module.css';

type EntityType = 'macro' | 'fem' | 'environment' | 'generic';

export const PropertiesPanel = () => {
  const params = useParams();

  const projectUuid = String(params?.id);
  const scenarioId =
    typeof params?.scenarioId === 'string'
      ? params.scenarioId
      : undefined;

  const {
    selectedEntity: selectedEntityId,
    entities,
    updateEntityProps,
  } = useCanvasStore();

  const selectedEntity = entities.find(
    (entity) => entity.uuid === selectedEntityId
  );

  const updateEntityMutation = useUpdateSystemEntity(
    projectUuid,
    scenarioId
  );

  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<EntityType>('generic');

  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [posZ, setPosZ] = useState(0);

  useEffect(() => {
    if (!selectedEntity) return;

    setEditName(selectedEntity.name ?? '');
    setEditCode(selectedEntity.code ?? '');

    setEditType(
      (selectedEntity.entityType ?? 'generic') as EntityType
    );

    setPosX(selectedEntity.position[0]);
    setPosY(selectedEntity.position[1]);
    setPosZ(selectedEntity.position[2]);
  }, [selectedEntity]);

  const handleSave = () => {
    if (!selectedEntity) return;

    updateEntityProps(selectedEntity.uuid, {
      name: editName,
      code: editCode,
      entityType: editType,
      position: [posX, posY, posZ],
    });

    updateEntityMutation.mutate({
      uuid: selectedEntity.uuid,
      data: {
        name: editName,
        code: editCode || undefined,
        entity_type: editType,
        pos_x: posX,
        pos_y: posY,
        pos_z: posZ,
      },
    });
  };

  return (
    <div className={styles.propertiesPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>Inspector</span>

          <h3 className={styles.panelTitle}>
            مشخصات سیستم
          </h3>
        </div>

        {selectedEntity ? (
          <span className={styles.panelStateActive}>
            انتخاب شده
          </span>
        ) : (
          <span className={styles.panelStateIdle}>
            بدون انتخاب
          </span>
        )}
      </div>

      {!selectedEntity ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>

          <p>یک سیستم را روی بوم انتخاب کنید.</p>

          <span>
            مشخصات، مختصات و نوع المان در این بخش نمایش داده می‌شود.
          </span>
        </div>
      ) : (
        <div className={styles.propertiesForm}>
          <div className={styles.uuidBox}>
            <span className={styles.propertyLabel}>
              UUID
            </span>

            <code>{selectedEntity.uuid}</code>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              نام
            </label>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={styles.input}
              placeholder="نام سیستم"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              کد
            </label>

            <input
              type="text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className={styles.input}
              placeholder="کد اختیاری"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.propertyLabel}>
              نوع المان
            </label>

            <select
              value={editType}
              onChange={(e) =>
                setEditType(e.target.value as EntityType)
              }
              className={styles.input}
            >
              <option value="macro">
                Macro Structure
              </option>

              <option value="fem">
                Finite Element Model
              </option>

              <option value="environment">
                Environment
              </option>

              <option value="generic">
                Generic Node
              </option>
            </select>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.coordinateSection}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionTitle}>
                مختصات فضایی
              </span>

              <span className={styles.sectionHint}>
                X / Y / Z
              </span>
            </div>

            <div className={styles.coordinatesGrid}>
              <div className={styles.coordInputGroup}>
                <label>X</label>

                <input
                  type="number"
                  step="0.5"
                  value={posX}
                  onChange={(e) =>
                    setPosX(Number(e.target.value || 0))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.coordInputGroup}>
                <label>Y</label>

                <input
                  type="number"
                  step="0.5"
                  value={posY}
                  onChange={(e) =>
                    setPosY(Number(e.target.value || 0))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.coordInputGroup}>
                <label>Z</label>

                <input
                  type="number"
                  step="0.5"
                  value={posZ}
                  onChange={(e) =>
                    setPosZ(Number(e.target.value || 0))
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateEntityMutation.isPending}
            className={styles.applyBtn}
          >
            {updateEntityMutation.isPending
              ? 'در حال همگام‌سازی...'
              : 'اعمال تغییرات'}
          </button>
        </div>
      )}
    </div>
  );
};
