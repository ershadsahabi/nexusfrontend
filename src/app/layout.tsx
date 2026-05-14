// src/app/layout.tsx
import type { Metadata } from "next";
import QueryProvider from "@/providers/QueryProvider";

import "./globals.css"; 

export const metadata: Metadata = {
  title: "Nexus Application",
  description: "Nexus Full-stack App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
