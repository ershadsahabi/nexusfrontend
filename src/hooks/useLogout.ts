// src\hooks\useLogout.ts

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authSession } from "@/lib/api/authSession";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    // ✅ clear session centralized
    authSession.clearTokens();

    // ✅ پاک کردن cache
    queryClient.clear();

    // ✅ خروج قطعی
    router.replace("/login");
  };

  return logout;
};
