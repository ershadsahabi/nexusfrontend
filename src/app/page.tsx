// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // ریدایرکت مستقیم به داشبورد کاربر
  redirect('/dashboard');
}
