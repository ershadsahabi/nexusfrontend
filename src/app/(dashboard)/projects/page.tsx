// src/app/(dashboard)/projects/page.tsx

"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { 
  useProjectsList, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject 
} from '@/hooks/useProjects';
import { useCreateScenario } from "@/hooks/useScenarios"; 
import { DataGrid, type ColumnDef } from '@/components/common/DataGrid/DataGrid';
import Button from '@/components/common/Button/Button';
import { ScenarioManagerModal } from '@/components/Scenarios/ScenarioManagerModal';
import type { Project } from '@/lib/api/types'; 
import styles from './projects.module.css';

export default function ProjectsPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  
  // استیت مربوط به مدیریت مودال سناریوها
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data, isLoading, isError } = useProjectsList();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  
  const createScenario = useCreateScenario(); 

  // --- هندلرهای مودال ---
  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };


  const handleCreateFlow = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!projectName.trim()) return;

  try {
    // مرحله 1: ساخت پروژه
    const newProject = await createProject.mutateAsync({ 
      name: projectName, 
      description: "ایجاد شده از طریق زنجیره سریع" 
    });

    // مرحله 2: ساخت سناریوی پیش‌فرض
    const newScenario = await createScenario.mutateAsync({
      name: "سناریوی پیش‌فرض",
      description: "",
      scenario_type: "custom",
      project: newProject.uuid,
    });

    // مرحله 3: هدایت به workspace
    router.push(`/workspace/${newProject.uuid}?scenarioId=${newScenario.uuid}`);
    
    // پاک کردن فرم
    setProjectName("");
  } catch (error) {
    console.error("خطا در ایجاد پروژه/سناریو:", error);
    // اینجا می‌تونی یک toast خطا نمایش بدی
  }
};


  const handleDelete = async (uuid: string, name: string) => {
    if (window.confirm(`آیا از حذف پروژه "${name}" مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`)) {
      try {
        await deleteProject.mutateAsync(uuid);
      } catch (error) {
        console.error("خطا در حذف پروژه:", error);
      }
    }
  };

  const handleEdit = async (project: Project) => {
    const newName = window.prompt("نام جدید پروژه را وارد کنید:", project.name);
    if (newName && newName !== project.name) {
      try {
        await updateProject.mutateAsync({ 
          uuid: project.uuid, 
          data: { name: newName } 
        });
      } catch (error) {
        console.error("خطا در ویرایش پروژه:", error);
      }
    }
  };

  // --- پیکربندی ستون‌های دیتاگرید ---
  const columns: ColumnDef<Project>[] = [
    { key: 'name', header: 'نام پروژه' },
    { key: 'description', header: 'توضیحات', render: (row) => row.description || '-' },
    { 
      key: 'created_at', 
      header: 'تاریخ ایجاد', 
      render: (row) => new Date(row.created_at).toLocaleDateString('fa-IR') 
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (row) => (
        <div className={styles.actionButtons}>
          {/* دکمه باز کردن مودال سناریوها */}
          <Button variant="primary" size="sm" onClick={() => handleOpenModal(row)}>
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
  ];

  if (isError) {
    return <div className={styles.errorState}>خطایی در دریافت پروژه‌ها رخ داد.</div>;
  }

  // استخراج لیست پروژه‌ها از پاسخ صفحه‌بندی شده API
  const projectsList = data?.results || [];

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
          />
          <Button type="submit" variant="primary" disabled={createProject.isPending}>
            {createProject.isPending ? "در حال ساخت..." : "ایجاد سریع"}
          </Button>
        </form>
      </div>

      <DataGrid<Project>
        data={projectsList}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(row) => row.uuid}
      />

      {/* مودال مدیریت سناریوها - فقط در صورت انتخاب یک پروژه رندر می‌شود */}
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
