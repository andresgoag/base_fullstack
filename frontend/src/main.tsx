import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./Router.tsx";
import { QueryProvider } from "./queries/QueryProvider.tsx";
import { ToastContextProvider } from "./context/toast/ToastContextProvider.tsx";
import "./i18n/config.ts";
import "./index.css";
import "./bootstrap.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastContextProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ToastContextProvider>
  </StrictMode>,
);
