// src/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // استفاده از useState برای اطمینان از اینکه در هر سشن یک نمونه واحد ساخته می‌شود
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // داده‌ها تا ۱ دقیقه تازه در نظر گرفته می‌شوند و درخواست تکراری زده نمی‌شود
            retry: 1, // در صورت قطعی اینترنت، فقط ۱ بار تلاش مجدد می‌کند
            refetchOnWindowFocus: false, // با تغییر تب مرورگر، درخواست بی‌دلیل ارسال نمی‌شود
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools فقط در محیط توسعه رندر می‌شود */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
