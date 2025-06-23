import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Router from "./Router.tsx";
import "./index.css";
import "./bootstrap.scss";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ToastContextProvider } from "./context/toast/ToastContextProvider.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastContextProvider>
        <Router />
      </ToastContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
