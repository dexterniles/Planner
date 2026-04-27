"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { SearchPaletteProvider } from "@/components/layout/search-palette-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ConfirmProvider>
          <SearchPaletteProvider>
            {children}
            <Toaster />
          </SearchPaletteProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
