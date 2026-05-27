// src/hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/auth.service';
import { LoginCredentials } from '@/lib/api/types';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // ذخیره توکن‌ها در لوکال استوریج
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      // پاک کردن کش قبلی (مثلا پروژه‌های کاربر قبلی)
      queryClient.clear();
      
      // هدایت به داشبورد
      router.push('/dashboard');
    },
  });
};
