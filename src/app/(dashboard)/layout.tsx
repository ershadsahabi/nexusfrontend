// src/app/(dashboard)/layout.tsx

import { DashboardLayout } from '@/components/layout/DashboardLayout/DashboardLayout';

export default function DashboardGroupRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // تمام صفحاتی که داخل گروه (dashboard) هستند (مثل projects) از این لایوت استفاده می‌کنند
  return <DashboardLayout>{children}</DashboardLayout>;
}
