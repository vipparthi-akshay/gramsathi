import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import ThemeRegistry from "@/theme/ThemeRegistry";
import { AuthProvider } from "@/store/AuthProvider";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeRegistry>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "8px",
                  background: "#333",
                  color: "#fff",
                  fontSize: "14px",
                },
              }}
            />
          </AuthProvider>
        </ThemeRegistry>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
