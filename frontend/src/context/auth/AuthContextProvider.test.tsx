import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { LoginForm } from "pages/Auth/Login";
import { RegisterForm } from "pages/Auth/Register";
import { renderWithProviders } from "test/renderWithProviders";
import {
  endAuthSession,
  getAuthSession,
  startAuthSession,
} from "auth/authSession";
import { buildAccessToken } from "test/tokens";
import { ApiError } from "api/errors";

const tokens = vi.hoisted(() => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
const users = vi.hoisted(() => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock("api/tokens", () => tokens);
vi.mock("api/users", () => users);

const CurrentPath = () => (
  <span data-testid="path">{useLocation().pathname}</span>
);

const renderLoginApp = (initialEntries: string[] = ["/auth/login"]) =>
  renderWithProviders(
    <>
      <CurrentPath />
      <Routes>
        <Route path="/auth/login" element={<LoginForm />} />
        <Route path="/" element={<div>dashboard</div>} />
        <Route path="/reports" element={<div>reports</div>} />
      </Routes>
    </>,
    { initialEntries },
  );

const fillLogin = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "SuperSecret123");
  await user.click(screen.getByRole("button", { name: "Login" }));
};

describe("AuthContextProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
    vi.clearAllMocks();
    users.getCurrentUser.mockResolvedValue({
      id: 1,
      email: "ada@example.com",
      phone: "+14155552671",
      first_name: "Ada",
      last_name: "Lovelace",
    });
  });

  it("stores the session and lands on the dashboard after login", async () => {
    const access = buildAccessToken(300_000);
    tokens.loginUser.mockResolvedValue({ access, refresh: "r1" });
    renderLoginApp();

    await fillLogin();

    expect(await screen.findByText("dashboard")).toBeInTheDocument();
    expect(getAuthSession()).toEqual({ access, refresh: "r1" });
  });

  it("returns the visitor to the page they originally requested", async () => {
    const access = buildAccessToken(300_000);
    tokens.loginUser.mockResolvedValue({ access, refresh: "r1" });
    renderWithProviders(
      <>
        <CurrentPath />
        <Routes>
          <Route path="/auth/login" element={<LoginForm />} />
          <Route path="/reports" element={<div>reports</div>} />
        </Routes>
      </>,
      {
        initialEntries: [
          { pathname: "/auth/login", state: { from: "/reports" } },
        ],
      },
    );

    await fillLogin();

    await waitFor(() => {
      expect(screen.getByTestId("path")).toHaveTextContent("/reports");
    });
  });

  it("shows the failure inline without starting a session", async () => {
    tokens.loginUser.mockRejectedValue(
      new ApiError({
        kind: "authentication",
        status: 401,
        message: "No active account found",
      }),
    );
    renderLoginApp();

    await fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No active account found",
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(getAuthSession().access).toBeNull();
  });

  it("reports an unexpected failure once through the global handler", async () => {
    tokens.loginUser.mockRejectedValue(
      new ApiError({
        kind: "server",
        status: 500,
        message: "Something went wrong on our side.",
      }),
    );
    renderLoginApp();

    await fillLogin();

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(1);
    });
    expect(getAuthSession().access).toBeNull();
  });

  it("signs the visitor in immediately after registering", async () => {
    users.registerUser.mockResolvedValue({ id: 2 });
    const access = buildAccessToken(300_000);
    tokens.loginUser.mockResolvedValue({ access, refresh: "r9" });
    renderWithProviders(
      <>
        <CurrentPath />
        <Routes>
          <Route path="/auth/register" element={<RegisterForm />} />
          <Route path="/" element={<div>dashboard</div>} />
        </Routes>
      </>,
      { initialEntries: ["/auth/register"] },
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("First Name"), "Ada");
    await user.type(screen.getByLabelText("Last Name"), "Lovelace");
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Phone Number"), "+14155552671");
    await user.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await user.type(screen.getByLabelText("Confirm Password"), "Tr0ubad0ur-x9");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("dashboard")).toBeInTheDocument();
    expect(getAuthSession()).toEqual({ access, refresh: "r9" });
  });

  it("sends the visitor to log in when the new account needs activation", async () => {
    users.registerUser.mockResolvedValue({ id: 3 });
    tokens.loginUser.mockRejectedValue(new Error("No active account found"));
    renderWithProviders(
      <>
        <CurrentPath />
        <Routes>
          <Route path="/auth/register" element={<RegisterForm />} />
          <Route path="/auth/login" element={<div>login page</div>} />
        </Routes>
      </>,
      { initialEntries: ["/auth/register"] },
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("First Name"), "Ada");
    await user.type(screen.getByLabelText("Last Name"), "Lovelace");
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Phone Number"), "+14155552671");
    await user.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await user.type(screen.getByLabelText("Confirm Password"), "Tr0ubad0ur-x9");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(getAuthSession().access).toBeNull();
  });

  it("clears the session and blacklists the refresh token on logout", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    tokens.blacklistToken.mockResolvedValue(undefined);

    const { LogoutProbe } = await import("test/LogoutProbe");
    renderWithProviders(<LogoutProbe />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(getAuthSession()).toEqual({ access: null, refresh: null });
    });
    expect(tokens.blacklistToken).toHaveBeenCalledWith("r1");
  });
});
