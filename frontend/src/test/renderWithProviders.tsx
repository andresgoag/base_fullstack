import type { ComponentProps, ReactNode } from "react";
import { render } from "@testing-library/react";
import {
  MemoryRouter,
  RouterProvider,
  type createMemoryRouter,
} from "react-router";
import { ToastContextProvider } from "context/toast/ToastContextProvider";
import { AuthContextProvider } from "context/auth/AuthContextProvider";
import { QueryProvider } from "queries/QueryProvider";

type RenderOptions = {
  initialEntries?: ComponentProps<typeof MemoryRouter>["initialEntries"];
};

export const renderWithProviders = (
  ui: ReactNode,
  { initialEntries = ["/"] }: RenderOptions = {},
) =>
  render(
    <ToastContextProvider>
      <QueryProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthContextProvider>{ui}</AuthContextProvider>
        </MemoryRouter>
      </QueryProvider>
    </ToastContextProvider>,
  );

export const renderWithRouter = (
  router: ReturnType<typeof createMemoryRouter>,
) =>
  render(
    <ToastContextProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ToastContextProvider>,
  );
