// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectsService } from "@/lib/api/services";
import type { ProjectRequest } from "@/lib/api/types"; // <--- تایپ اصلی از اینجا خوانده می‌شود

// کلیدهای کش برای مدیریت دقیق
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: any) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (uuid: string) => [...projectKeys.details(), uuid] as const,
};

// هوک برای دریافت لیست پروژه‌ها
export const useProjectsList = (params?: { page?: number; search?: string }) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => ProjectsService.getList(params),
  });
};

// هوک برای دریافت یک پروژه خاص
export const useProjectDetail = (uuid: string) => {
  return useQuery({
    queryKey: projectKeys.detail(uuid),
    queryFn: () => ProjectsService.getById(uuid),
    enabled: !!uuid, // فقط در صورتی که uuid وجود داشته باشد اجرا می‌شود
  });
};

// هوک برای ساخت پروژه جدید
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    // ✅ اصلاح شد: استفاده از تایپ مرکزی ProjectRequest و سرویس یکپارچه
    mutationFn: (data: ProjectRequest) => ProjectsService.create(data),
    
    onSuccess: () => {
      // رفرش کردن تمام queryهای مربوط به پروژه‌ها (لیست و جزئیات)
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      // پیشنهاد: اینجا می‌توانید یک toast یا notification خطا نمایش دهید
      console.error("Failed to create project:", error);
    }
  });
};

// هوک برای ویرایش پروژه
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    // این هوک از قبل به درستی از تایپ Partial<ProjectRequest> استفاده می‌کرد
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<ProjectRequest> }) => 
      ProjectsService.update(uuid, data),
      
    onSuccess: (_updatedProject, variables) => {
      // رفرش کردن تمام queryهای پروژه‌ها برای اطمینان از هماهنگی داده‌ها
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error, variables) => {
       console.error(`Failed to update project ${variables.uuid}:`, error);
    }
  });
};

// هوک برای حذف پروژه
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (uuid: string) => ProjectsService.delete(uuid),
    onSuccess: () => {
      // پس از حذف، فقط کافیست لیست‌ها رفرش شوند
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error, uuid) => {
      console.error(`Failed to delete project ${uuid}:`, error);
    }
  });
};
