// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authSession } from "@/lib/api/authSession";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = authSession.getAccessToken();

    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }

    setIsChecking(false);
  }, [router]);

  // جلوگیری از flicker UI قبل از check
  if (isChecking) return null;

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
