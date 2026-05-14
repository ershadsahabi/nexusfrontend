import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    // پاک کردن توکن‌ها
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // پاک کردن دیتای کش شده (پروژه‌ها و غیره)
    queryClient.clear();
    
    // هدایت به لاگین
    router.push('/login');
  };

  return logout;
};
