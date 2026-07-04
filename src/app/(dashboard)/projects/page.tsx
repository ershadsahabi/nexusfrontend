// src/app/(dashboard)/projects/page.tsx

"use client";

import React, { useMemo, useState } from "react";
import {
  useProjectsList,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useQuickCreateProjectFlow } from "@/hooks/useQuickCreateProjectFlow";
import { DataGrid, type ColumnDef } from "@/components/common/DataGrid/DataGrid";
import Button from "@/components/common/Button/Button";
import { ScenarioManagerModal } from "@/components/Scenarios/ScenarioManagerModal";
import type { Project } from "@/lib/api/types";
import styles from "./projects.module.css";

export default function ProjectsPage() {
  const [projectName, setProjectName] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data, isLoading, isError } = useProjectsList();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const {
    createFlow,
    isPending: isQuickCreatePending,
  } = useQuickCreateProjectFlow();

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const handleCreateFlow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = projectName.trim();
    if (!trimmedName || isQuickCreatePending) return;

    try {
      await createFlow({
        projectName: trimmedName,
      });

      setProjectName("");
    } catch (error) {
      console.error("خطا در اجرای گردش ایجاد سریع پروژه:", error);
      // در صورت وجود سیستم toast، اینجا بهترین محل برای نمایش پیام کاربرپسند است
    }
  };

  const handleDelete = async (uuid: string, name: string) => {
    const confirmed = window.confirm(
      `آیا از حذف پروژه "${name}" مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`
    );

    if (!confirmed) return;

    try {
      await deleteProject.mutateAsync(uuid);
    } catch (error) {
      console.error("خطا در حذف پروژه:", error);
    }
  };

  const handleEdit = async (project: Project) => {
    const newName = window.prompt("نام جدید پروژه را وارد کنید:", project.name);
    const trimmedName = newName?.trim();

    if (!trimmedName || trimmedName === project.name) return;

    try {
      await updateProject.mutateAsync({
        uuid: project.uuid,
        data: { name: trimmedName },
      });
    } catch (error) {
      console.error("خطا در ویرایش پروژه:", error);
    }
  };

  const columns: ColumnDef<Project>[] = useMemo(
    () => [
      {
        key: "name",
        header: "نام پروژه",
      },
      {
        key: "description",
        header: "توضیحات",
        render: (row) => row.description || "-",
      },
      {
        key: "created_at",
        header: "تاریخ ایجاد",
        render: (row) => new Date(row.created_at).toLocaleDateString("fa-IR"),
      },
      {
        key: "actions",
        header: "عملیات",
        render: (row) => (
          <div className={styles.actionButtons}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal(row)}
            >
              مدیریت سناریوها
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row)}
              disabled={updateProject.isPending}
            >
              ویرایش
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(row.uuid, row.name)}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "در حال حذف..." : "حذف"}
            </Button>
          </div>
        ),
      },
    ],
    [deleteProject.isPending, updateProject.isPending]
  );

  if (isError) {
    return (
      <div className={styles.errorState}>
        خطایی در دریافت پروژه‌ها رخ داد.
      </div>
    );
  }

  const projectsList = data?.results ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>مدیریت پروژه‌ها</h1>

        <form onSubmit={handleCreateFlow} className={styles.createForm}>
          <input
            type="text"
            placeholder="نام پروژه جدید..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={styles.input}
            disabled={isQuickCreatePending}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isQuickCreatePending || !projectName.trim()}
          >
            {isQuickCreatePending ? "در حال ساخت..." : "ایجاد سریع"}
          </Button>
        </form>
      </div>

      <DataGrid<Project>
        data={projectsList}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(row) => row.uuid}
      />

      {selectedProject && (
        <ScenarioManagerModal
          projectUuid={selectedProject.uuid}
          isOpen={!!selectedProject}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
