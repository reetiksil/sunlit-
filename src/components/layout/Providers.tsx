"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

function AuthBootstrap() {
  const refresh = useAuthStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);
  const syncWithServer = useBookshelfStore((s) => s.syncWithServer);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (user) {
      void syncWithServer();
    }
  }, [user, syncWithServer]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
