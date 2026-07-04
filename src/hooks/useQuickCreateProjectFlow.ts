// src/hooks/useQuickCreateProjectFlow.ts


"use client";

import { useRouter } from "next/navigation";
import { useCreateProject, projectKeys } from "@/hooks/useProjects";
import { useCreateScenario, scenarioKeys } from "@/hooks/useScenarios";
import { useQueryClient } from "@tanstack/react-query";

type QuickCreateProjectFlowInput = {
  projectName: string;
  projectDescription?: string;
  scenarioName?: string;
  scenarioDescription?: string;
};

export const useQuickCreateProjectFlow = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createProject = useCreateProject();
  const createScenario = useCreateScenario();

  const createFlow = async ({
    projectName,
    projectDescription = "ایجاد شده از طریق زنجیره سریع",
    scenarioName = "سناریوی پیش‌فرض",
    scenarioDescription = "",
  }: QuickCreateProjectFlowInput) => {
    const trimmedProjectName = projectName.trim();

    if (!trimmedProjectName) {
      throw new Error("Project name is required.");
    }

    // مرحله 1: ساخت پروژه
    const newProject = await createProject.mutateAsync({
      name: trimmedProjectName,
      description: projectDescription,
    });

    // مرحله 2: ساخت سناریوی پیش‌فرض
    const newScenario = await createScenario.mutateAsync({
      name: scenarioName,
      description: scenarioDescription,
      scenario_type: "custom",
      project: newProject.uuid,
    });

    // مرحله 3: اطمینان از همگام‌سازی cache
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      queryClient.invalidateQueries({
        queryKey: scenarioKeys.list(newProject.uuid),
      }),
    ]);

    // مرحله 4: هدایت به workspace
    router.push(`/workspace/${newProject.uuid}?scenarioId=${newScenario.uuid}`);

    return {
      project: newProject,
      scenario: newScenario,
    };
  };

  return {
    createFlow,
    isPending: createProject.isPending || createScenario.isPending,
  };
};
