import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthContext } from "@/context/auth/AuthContext";
import type { Session } from "@/auth/types";

type AuthContextValue = React.ContextType<typeof AuthContext>;

const buildAuthValue = (
  overrides: Partial<NonNullable<AuthContextValue>>,
): NonNullable<AuthContextValue> =>
  ({
    session: null,
    currentUser: null,
    isLoadingUser: false,
    isInitializing: false,
    login: {} as NonNullable<AuthContextValue>["login"],
    register: {} as NonNullable<AuthContextValue>["register"],
    logout: () => {},
    ...overrides,
  }) as NonNullable<AuthContextValue>;

const renderProtectedRoute = (value: NonNullable<AuthContextValue>) =>
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<p>secret dashboard</p>} />
          </Route>
          <Route path="/auth/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const session: Session = { access: "access", refresh: "refresh" };

describe("ProtectedRoute", () => {
  it("shows a spinner while the session is being restored", () => {
    renderProtectedRoute(buildAuthValue({ isInitializing: true }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
  });

  it("redirects to login when there is no session", () => {
    renderProtectedRoute(buildAuthValue({}));
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the protected content when a session exists", () => {
    renderProtectedRoute(buildAuthValue({ session }));
    expect(screen.getByText("secret dashboard")).toBeInTheDocument();
  });

  it("does not redirect before initialization finishes", () => {
    renderProtectedRoute(buildAuthValue({ isInitializing: true }));
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });
});
