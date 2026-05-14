// src/lib/api/services/projects.service.ts
import { apiClient } from '../axios';
import type { Project, ProjectRequest, PaginatedProjectList } from '../types';

export const ProjectsService = {
  /**
   * دریافت لیست پروژه‌ها (با پشتیبانی از صفحه‌بندی و فیلتر)
   */
  async getList(params?: { page?: number; search?: string }): Promise<PaginatedProjectList> {
    const response = await apiClient.get<PaginatedProjectList>('/projects/', { params });
    return response.data;
  },

  /**
   * دریافت اطلاعات یک پروژه خاص بر اساس UUID
   */
  async getById(uuid: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${uuid}/`);
    return response.data;
  },

  /**
   * ایجاد پروژه جدید
   */
  async create(data: ProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },

  /**
   * آپدیت پروژه (Patch برای آپدیت‌های جزئی پیشنهاد می‌شود)
   */
  async update(uuid: string, data: Partial<ProjectRequest>): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${uuid}/`, data);
    return response.data;
  },

  /**
   * حذف پروژه
   */
  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/projects/${uuid}/`);
  }
};
