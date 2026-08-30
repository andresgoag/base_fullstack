import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { LoginForm } from "pages/Auth/Login";
import { renderWithProviders } from "test/renderWithProviders";
import { ApiError } from "api/errors";
import { endAuthSession } from "auth/authSession";

const tokens = vi.hoisted(() => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
vi.mock("api/tokens", () => tokens);
vi.mock("api/users", () => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const renderLogin = () =>
  renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<LoginForm />} />
      <Route path="/" element={<div>dashboard</div>} />
    </Routes>,
    { initialEntries: ["/auth/login"] },
  );

describe("LoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
    vi.clearAllMocks();
  });

  it("asks for the missing fields instead of submitting", async () => {
    renderLogin();

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(tokens.loginUser).not.toHaveBeenCalled();
  });

  it("rejects an address that is not an email", async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText("Email address"), "ada@");
    await userEvent.type(screen.getByLabelText("Password"), "SuperSecret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(tokens.loginUser).not.toHaveBeenCalled();
  });

  it("describes the error to assistive technology", async () => {
    renderLogin();

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    const emailInput = await screen.findByLabelText("Email address");
    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
    expect(emailInput).toHaveClass("is-invalid");
    const errorId = emailInput.getAttribute("aria-describedby");
    expect(errorId).not.toBeNull();
    expect(document.getElementById(errorId ?? "")).toHaveTextContent(
      "Email is required.",
    );
  });

  it("trims the address before sending it", async () => {
    tokens.loginUser.mockRejectedValue(
      new ApiError({ kind: "authentication", status: 401, message: "No" }),
    );
    renderLogin();

    await userEvent.type(
      screen.getByLabelText("Email address"),
      "  ada@example.com  ",
    );
    await userEvent.type(screen.getByLabelText("Password"), "SuperSecret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(tokens.loginUser).toHaveBeenCalled();
    });
    expect(tokens.loginUser.mock.calls[0][0]).toEqual({
      email: "ada@example.com",
      password: "SuperSecret123",
    });
  });

  it("puts a server field error on the field it belongs to", async () => {
    tokens.loginUser.mockRejectedValue(
      new ApiError({
        kind: "validation",
        status: 400,
        message: "Check the form.",
        fieldErrors: { email: "This account was disabled." },
      }),
    );
    renderLogin();

    await userEvent.type(
      screen.getByLabelText("Email address"),
      "ada@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "SuperSecret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("This account was disabled."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check the form.")).not.toBeInTheDocument();
  });

  it("shows a banner when the server blames no field in particular", async () => {
    tokens.loginUser.mockRejectedValue(
      new ApiError({
        kind: "authentication",
        status: 401,
        message: "No active account found.",
      }),
    );
    renderLogin();

    await userEvent.type(
      screen.getByLabelText("Email address"),
      "ada@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "SuperSecret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("No active account found."),
    ).toBeInTheDocument();
  });
});
