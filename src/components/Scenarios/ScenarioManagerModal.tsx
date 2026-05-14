// src/components/Scenarios/ScenarioManagerModal.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal/Modal";
import Button from "@/components/common/Button/Button";
import Spinner from "@/components/common/Spinner/Spinner";
import styles from "./ScenarioManagerModal.module.css";

import {
  useScenariosList,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
} from "@/hooks/useScenarios";

import type { Scenario, ScenarioRequest } from "@/lib/api/types";

interface ScenarioManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectUuid: string;
}

type ScenarioType =
  | "service"
  | "ultimate"
  | "seismic"
  | "wind"
  | "thermal"
  | "construction"
  | "custom";

interface ScenarioFormData {
  name: string;
  description: string;
  scenario_type: ScenarioType;
  is_active: boolean;
}

const initialFormState: ScenarioFormData = {
  name: "",
  description: "",
  scenario_type: "custom",
  is_active: true,
};

const scenarioTypeLabels: Record<ScenarioType, string> = {
  custom: "Custom",
  service: "Service",
  ultimate: "Ultimate",
  seismic: "Seismic",
  wind: "Wind",
  thermal: "Thermal",
  construction: "Construction",
};

export const ScenarioManagerModal: React.FC<ScenarioManagerModalProps> = ({
  isOpen,
  onClose,
  projectUuid,
}) => {
  const router = useRouter();

  const { data: scenarios = [], isLoading, isError } =
    useScenariosList(projectUuid);

  const createScenario = useCreateScenario(projectUuid);
  const updateScenario = useUpdateScenario(projectUuid);
  const deleteScenario = useDeleteScenario(projectUuid);

  const [formData, setFormData] = useState<ScenarioFormData>(initialFormState);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  const isSubmitting = createScenario.isPending || updateScenario.isPending;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingUuid(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const payload: ScenarioRequest = {
      name: formData.name,
      description: formData.description,
      scenario_type: formData.scenario_type,
      is_active: formData.is_active,
      project: projectUuid,
    };

    try {
      if (editingUuid) {
        await updateScenario.mutateAsync({
          uuid: editingUuid,
          data: payload,
        });
      } else {
        await createScenario.mutateAsync(payload);
      }

      resetForm();
    } catch (err) {
      console.error("Scenario save error:", err);
    }
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingUuid(scenario.uuid);

    setFormData({
      name: scenario.name,
      description: scenario.description || "",
      scenario_type: (scenario.scenario_type as ScenarioType) || "custom",
      is_active: scenario.is_active ?? true,
    });
  };

  const handleDelete = async (uuid: string) => {
    const confirmed = window.confirm("آیا از حذف این سناریو مطمئن هستید؟");
    if (!confirmed) return;

    try {
      await deleteScenario.mutateAsync(uuid);
    } catch (err) {
      console.error("Scenario delete error:", err);
    }
  };

  const handleEnterCanvas = (scenarioUuid: string) => {
    router.push(`/workspace/${projectUuid}?scenarioId=${scenarioUuid}`);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="مدیریت سناریوها">
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.topBarText}>
            <span className={styles.eyebrow}>Scenario Control</span>
            <h3 className={styles.modalTitle}>تعریف و مدیریت سناریوهای پروژه</h3>
          </div>

          <div className={styles.summaryBadge}>
            <span className={styles.summaryLabel}>تعداد سناریوها</span>
            <strong>{scenarios.length}</strong>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                {editingUuid ? "ویرایش سناریو" : "ایجاد سناریوی جدید"}
              </h3>
              <span className={styles.formStatus}>
                {editingUuid ? "Edit Mode" : "Create Mode"}
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name">نام سناریو *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثلاً: سناریوی بارگذاری زلزله"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">توضیحات</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="توضیحات اختیاری برای این سناریو"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="scenario_type">نوع سناریو</label>
              <select
                id="scenario_type"
                name="scenario_type"
                value={formData.scenario_type}
                onChange={handleInputChange}
              >
                <option value="custom">Custom</option>
                <option value="service">Service</option>
                <option value="ultimate">Ultimate</option>
                <option value="seismic">Seismic</option>
                <option value="wind">Wind</option>
                <option value="thermal">Thermal</option>
                <option value="construction">Construction</option>
              </select>
            </div>

            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span>فعال باشد</span>
              </label>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={isSubmitting}>
                {editingUuid ? "ذخیره تغییرات" : "افزودن سناریو"}
              </Button>

              {editingUuid && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                >
                  لغو
                </Button>
              )}
            </div>
          </form>

          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3 className={styles.listTitle}>سناریوهای پروژه</h3>
            </div>

            {isLoading && (
              <div className={styles.loading}>
                <Spinner />
              </div>
            )}

            {isError && (
              <div className={styles.error}>
                خطا در دریافت سناریوها
              </div>
            )}

            {!isLoading && !isError && scenarios.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>◎</div>
                <strong>هنوز سناریویی ایجاد نشده است</strong>
                <span>از فرم سمت راست برای ساخت اولین سناریو استفاده کنید.</span>
              </div>
            )}

            {!isLoading && !isError && scenarios.length > 0 && (
              <ul className={styles.scenarioList}>
                {scenarios.map((scenario) => (
                  <li key={scenario.uuid} className={styles.scenarioItem}>
                    <div className={styles.scenarioInfo}>
                      <div className={styles.scenarioTopRow}>
                        <div className={styles.scenarioNameBlock}>
                          <div className={styles.scenarioName}>{scenario.name}</div>
                          <div className={styles.scenarioUuid}>{scenario.uuid}</div>
                        </div>

                        <span
                          className={`${styles.statusChip} ${
                            scenario.is_active
                              ? styles.statusChipActive
                              : styles.statusChipInactive
                          }`}
                        >
                          {scenario.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </div>

                      {scenario.description && (
                        <div className={styles.scenarioDescription}>
                          {scenario.description}
                        </div>
                      )}

                      <div className={styles.scenarioMetaRow}>
                        <span className={styles.typeBadge}>
                          {scenarioTypeLabels[
                            (scenario.scenario_type as ScenarioType) || "custom"
                          ]}
                        </span>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        onClick={() => handleEnterCanvas(scenario.uuid)}
                      >
                        ورود به بوم
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(scenario)}
                      >
                        ویرایش
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        disabled={deleteScenario.isPending}
                        onClick={() => handleDelete(scenario.uuid)}
                      >
                        حذف
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
