"use client";

import { useState } from 'react';
import { useLogin } from '@/hooks/useAuth';
import styles from './login.module.css'; // فرض بر این است که استایل‌ها را اینجا می‌نویسید

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

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
          {loginMutation.isPending ? 'در حال ورود...' : 'ورود'}
        </button>
        {loginMutation.isError && <p className={styles.error}>خطا در ورود. اطلاعات را بررسی کنید.</p>}
      </form>
    </div>
  );
}
