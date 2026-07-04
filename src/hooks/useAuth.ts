// src/hooks/useAuth.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/api/services/auth.service";
import { LoginCredentials } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { authSession } from "@/lib/api/authSession";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),

    onSuccess: (data) => {
      // ✅ ذخیره توکن‌ها به صورت centralized
      authSession.setTokens(data.access, data.refresh);

      // ✅ پاک کردن کش کاربر قبلی
      queryClient.clear();

      // ✅ ورود به فضای protected
      router.replace("/dashboard");
    },
  });
};
