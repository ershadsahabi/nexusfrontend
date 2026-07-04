// src/hooks/useProjects.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectsService } from "@/lib/api/services";
import type { ProjectRequest } from "@/lib/api/types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: { page?: number; search?: string }) =>
    [...projectKeys.lists(), params ?? {}] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (uuid: string) => [...projectKeys.details(), uuid] as const,
};

export const useProjectsList = (params?: { page?: number; search?: string }) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => ProjectsService.getList(params),
  });
};

export const useProjectDetail = (uuid: string) => {
  return useQuery({
    queryKey: projectKeys.detail(uuid),
    queryFn: () => ProjectsService.getById(uuid),
    enabled: !!uuid,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectRequest) => ProjectsService.create(data),

    onSuccess: (createdProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });

      if (createdProject?.uuid) {
        queryClient.setQueryData(
          projectKeys.detail(createdProject.uuid),
          createdProject
        );
      }
    },

    onError: (error) => {
      console.error("Failed to create project:", error);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: Partial<ProjectRequest>;
    }) => ProjectsService.update(uuid, data),

    onSuccess: (updatedProject, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });

      if (variables.uuid) {
        queryClient.setQueryData(
          projectKeys.detail(variables.uuid),
          updatedProject
        );
      }
    },

    onError: (error, variables) => {
      console.error(`Failed to update project ${variables.uuid}:`, error);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => ProjectsService.delete(uuid),

    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      queryClient.removeQueries({
        queryKey: projectKeys.detail(uuid),
      });
    },

    onError: (error, uuid) => {
      console.error(`Failed to delete project ${uuid}:`, error);
    },
  });
};
