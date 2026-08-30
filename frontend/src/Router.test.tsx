import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { routes } from "./Router";
import { RouteError } from "components/RouteError/RouteError";
import { renderWithRouter } from "test/renderWithProviders";
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
    email: "ada@example.com",
    phone: "+14155552671",
    first_name: "Ada",
    last_name: "Lovelace",
  }),
}));

const renderAt = (path: string) =>
  renderWithRouter(createMemoryRouter(routes, { initialEntries: [path] }));

const signIn = () => {
  startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
};

describe("routes", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
  });

  it("redirects the auth index to the login page", async () => {
    renderAt("/auth");
    expect(
      await screen.findByRole("button", { name: "Login" }),
    ).toBeInTheDocument();
  });

  it("renders the not found page for an unknown path", async () => {
    renderAt("/nowhere");
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to home" }),
    ).toBeInTheDocument();
  });

  it("keeps an unknown auth path inside the auth layout", async () => {
    renderAt("/auth/nowhere");
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(document.querySelector(".card")).not.toBeNull();
  });

  it("sends an anonymous visitor from a protected page to the login page", async () => {
    renderAt("/account");
    expect(
      await screen.findByRole("button", { name: "Login" }),
    ).toBeInTheDocument();
  });

  it("renders the dashboard inside the application layout once signed in", async () => {
    signIn();
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My App" })).toBeInTheDocument();
  });

  it("keeps a signed in visitor away from the public landing page", async () => {
    signIn();
    renderAt("/home");
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("shows the navigation bar on a not found page while signed in", async () => {
    signIn();
    renderAt("/nowhere");
    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My App" })).toBeInTheDocument();
  });

  it("names the current page in the document title", async () => {
    renderAt("/auth/login");
    await waitFor(() => {
      expect(document.title).toBe("Login · Fullstack project");
    });
  });

  it("renders the error page instead of crashing the application", async () => {
    const Boom = () => {
      throw new Error("route exploded");
    };
    const router = createMemoryRouter([
      { path: "/", element: <Boom />, errorElement: <RouteError /> },
    ]);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderWithRouter(router);

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("route exploded")).toBeInTheDocument();
  });
});
