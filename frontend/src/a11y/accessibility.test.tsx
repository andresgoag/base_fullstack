import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { routes } from "Router";
import { renderWithRouter } from "test/renderWithProviders";
import { findAccessibilityViolations } from "test/axe";
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
vi.mock("api/comments", () => ({ getSimilarComments: vi.fn() }));

const renderAt = (path: string) =>
  renderWithRouter(createMemoryRouter(routes, { initialEntries: [path] }));

describe("accessibility", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
  });

  it("has no violations on the login page", async () => {
    const { container } = renderAt("/auth/login");
    await screen.findByRole("button", { name: "Login" });

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it("has no violations on the dashboard", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    const { container } = renderAt("/");
    await screen.findByRole("heading", { name: "Dashboard" });

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it("has no violations on the not found page", async () => {
    const { container } = renderAt("/nowhere");
    await screen.findByText("404");

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it("offers a skip link before the navigation", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderAt("/");

    const skipLink = await screen.findByRole("link", {
      name: "Skip to main content",
    });
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("gives every page a main landmark", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderAt("/");

    expect(await screen.findByRole("main")).toBeInTheDocument();
  });

  it("starts each page with a level one heading", async () => {
    const { container } = renderAt("/auth/register");
    await screen.findByRole("button", { name: "Register" });

    const firstHeading = container.querySelector("h1, h2, h3, h4, h5, h6");
    expect(firstHeading?.tagName).toBe("H1");
  });

  it("moves focus to the main landmark after navigating", async () => {
    startAuthSession({ access: buildAccessToken(300_000), refresh: "r1" });
    renderAt("/");
    await screen.findByRole("heading", { name: "Dashboard" });

    await userEvent.click(screen.getByRole("link", { name: "Comments" }));

    await screen.findByRole("heading", { name: "Similar comments" });
    await waitFor(() => {
      expect(document.activeElement).toBe(
        document.getElementById("main-content"),
      );
    });
  });
});
