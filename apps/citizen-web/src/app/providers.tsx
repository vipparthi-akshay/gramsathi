"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import "@/i18n/config";

const GramFloatingAssistant = dynamic(
  () => import("@/components/ai/GramFloatingAssistant"),
  { ssr: false },
);

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <GramFloatingAssistant />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: 16,
            padding: "12px 20px",
            fontSize: "0.9rem",
          },
          success: {
            iconTheme: {
              primary: "#2E7D32",
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#C62828",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
