import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import Router from "./Router.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { ToastContextProvider } from "@/context/toast/ToastContextProvider";
import "./index.css";
import "./bootstrap.scss";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastContextProvider>
          <Router />
        </ToastContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
