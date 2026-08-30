import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import { ProtectedRoute } from "components/ProtectedRoute/ProtectedRoute";
import { renderWithProviders } from "test/renderWithProviders";
import { endAuthSession, startAuthSession } from "auth/authSession";
import { buildAccessToken } from "test/tokens";

vi.mock("api/tokens", () => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
vi.mock("api/users", () => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    email: "user@example.com",
    phone: "+14155552671",
    first_name: "Ada",
    last_name: "Lovelace",
  }),
}));

const LoginProbe = () => {
  const location = useLocation();
  return (
    <div>
      <span>login page</span>
      <span data-testid="from">
        {String((location.state as { from?: string } | null)?.from)}
      </span>
    </div>
  );
};

const renderGuardedApp = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<LoginProbe />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/reports" element={<div>reports page</div>} />
      </Route>
    </Routes>,
    { initialEntries: [path] },
  );

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
  });

  it("redirects an anonymous visitor to the login page", async () => {
    renderGuardedApp("/reports");
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("remembers the page the visitor was trying to reach", async () => {
    renderGuardedApp("/reports?page=2");
    await waitFor(() => {
      expect(screen.getByTestId("from")).toHaveTextContent("/reports?page=2");
    });
  });

  it("renders the guarded page for an authenticated visitor", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderGuardedApp("/reports");
    expect(await screen.findByText("reports page")).toBeInTheDocument();
  });
});
