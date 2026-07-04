// src/app/(dashboard)/layout.tsx

import AuthGuard from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout/DashboardLayout";

export default function DashboardGroupRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
