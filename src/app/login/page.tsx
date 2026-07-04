// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useLogin } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { authSession } from "@/lib/api/authSession";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ جلوگیری از ورود مجدد کاربر authenticated به صفحه login
  useEffect(() => {
    const token = authSession.getAccessToken();
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2>ورود به سیستم</h2>

        <div className={styles.formGroup}>
          <label>ایمیل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>رمز عبور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "در حال ورود..." : "ورود"}
        </button>

        {loginMutation.isError && (
          <p className={styles.error}>
            خطا در ورود. اطلاعات را بررسی کنید.
          </p>
        )}
      </form>
    </div>
  );
}
