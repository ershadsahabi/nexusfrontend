// src/hooks/useScenarios.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScenariosService from '@/lib/api/services/scenarios.service';
import type { Scenario, ScenarioRequest, PaginatedScenarioList } from '@/lib/api/types';

/**
 * کلیدهای کوئری متمرکز برای سناریوها
 * این الگو ثبات را تضمین کرده و از خطاهای تایپی هنگام مدیریت کش جلوگیری می‌کند.
 * این ساختار به ما امکان ابطال (invalidation) دقیق و قابل پیش‌بینی کوئری‌ها را می‌دهد.
 */
export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: (projectUuid: string) => [...scenarioKeys.lists(), { projectUuid }] as const,
  details: () => [...scenarioKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...scenarioKeys.details(), uuid] as const,
};

/**
 * هوک برای واکشی لیست سناریوهای یک پروژه مشخص.
 * این هوک پاسخ صفحه‌بندی شده API را مدیریت کرده و فقط آرایه نتایج را برمی‌گرداند
 * که باعث ساده‌سازی منطق در کامپوننت‌ها می‌شود.
 *
 * @param projectUuid - شناسه منحصر به فرد پروژه. کوئری تا زمانی که این مقدار وجود نداشته باشد، غیرفعال است.
 */
export const useScenariosList = (projectUuid?: string) => {
  return useQuery<PaginatedScenarioList, Error, Scenario[]>({
    // کلید کوئری برای لیست سناریوهای این پروژه منحصر به فرد است.
    queryKey: scenarioKeys.list(projectUuid!),
    // تابع کوئری، سرویس مربوطه را فراخوانی می‌کند.
    queryFn: () => ScenariosService.getAll(projectUuid!),
    // کوئری تا زمانی که projectUuid در دسترس نباشد، اجرا نخواهد شد.
    enabled: !!projectUuid,
    // گزینه `select` داده‌های صفحه‌بندی شده ورودی را تبدیل کرده
    // و تنها آرایه سناریوها (results) را که کامپوننت نیاز دارد، برمی‌گرداند.
    select: (paginatedData) => paginatedData.results,
  });
};

/**
 * هوک برای ایجاد یک سناریوی جدید.
 * این هوک جهش (mutation) به API را مدیریت کرده و در صورت موفقیت، کش کوئری مربوطه را باطل می‌کند.
 *
 * @param projectUuid - شناسه پروژه‌ای که سناریو به آن اضافه خواهد شد.
 */
export const useCreateScenario = (projectUuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioData: ScenarioRequest) => ScenariosService.create(scenarioData),
    /**
     * در صورت موفقیت، کوئری لیست مختص این پروژه را باطل کن.
     * این کار باعث واکشی مجدد لیست سناریوها و نمایش آیتم جدید می‌شود.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.list(projectUuid) });
    },
  });
};

/**
 * هوک برای به‌روزرسانی یک سناریوی موجود.
 *
 * @param projectUuid - شناسه پروژه حاوی سناریو.
 *                    برای باطل کردن کوئری لیست صحیح، این پارامتر ضروری است.
 */
export const useUpdateScenario = (projectUuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ScenarioRequest }) =>
      ScenariosService.update(uuid, data),
    /**
     * در صورت موفقیت، هم کوئری لیست و هم کوئری جزئیات مربوط به این سناریو را باطل کن.
     * این کار تضمین می‌کند که هم نمای لیست و هم هر نمای جزئیات احتمالی، به‌روز می‌شوند.
     */
    onSuccess: (_updatedScenario, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.list(projectUuid) });
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(uuid) });
    },
  });
};

/**
 * هوک برای حذف یک سناریو.
 *
 * @param projectUuid - شناسه پروژه حاوی سناریو.
 *                    برای باطل کردن کوئری لیست صحیح، این پارامتر ضروری است.
 */
export const useDeleteScenario = (projectUuid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => ScenariosService.delete(uuid),
    /**
     * در صورت موفقیت، لیست را برای انعکاس حذف، باطل کن.
     * هر کوئری جزئیات برای این سناریو به طور خودکار قدیمی (stale) خواهد شد.
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.list(projectUuid) });
    },
  });
};
