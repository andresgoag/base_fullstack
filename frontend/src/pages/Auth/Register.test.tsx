import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { RegisterForm } from "pages/Auth/Register";
import { renderWithProviders } from "test/renderWithProviders";
import { ApiError } from "api/errors";
import { endAuthSession } from "auth/authSession";
import { MAX_PERSON_NAME_LENGTH } from "validation";

const users = vi.hoisted(() => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
}));
const tokens = vi.hoisted(() => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  blacklistToken: vi.fn(),
}));
vi.mock("api/users", () => users);
vi.mock("api/tokens", () => tokens);

const renderRegister = () =>
  renderWithProviders(
    <Routes>
      <Route path="/auth/register" element={<RegisterForm />} />
      <Route path="/" element={<div>dashboard</div>} />
      <Route path="/auth/login" element={<div>login page</div>} />
    </Routes>,
    { initialEntries: ["/auth/register"] },
  );

const fillRequiredFields = async () => {
  await userEvent.type(screen.getByLabelText("First Name"), "Ada");
  await userEvent.type(screen.getByLabelText("Last Name"), "Lovelace");
  await userEvent.type(
    screen.getByLabelText("Email address"),
    "ada@example.com",
  );
  await userEvent.type(screen.getByLabelText("Phone Number"), "+14155552671");
};

describe("RegisterForm", () => {
  beforeEach(() => {
    localStorage.clear();
    endAuthSession();
    vi.clearAllMocks();
  });

  it("blocks a submission where the passwords do not match", async () => {
    renderRegister();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "Tr0ubad0ur-x8",
    );

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(users.registerUser).not.toHaveBeenCalled();
  });

  it("revalidates the confirmation after the password changes", async () => {
    users.registerUser.mockRejectedValue(
      new ApiError({ kind: "server", status: 500, message: "Try again." }),
    );
    renderRegister();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "Tr0ubad0ur-x9",
    );
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => {
      expect(users.registerUser).toHaveBeenCalled();
    });
    users.registerUser.mockClear();

    await userEvent.type(screen.getByLabelText("Password"), "-more");
    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument();
    expect(users.registerUser).not.toHaveBeenCalled();
  });

  it("blocks a weak password", async () => {
    renderRegister();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText("Password"), "12345678");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "12345678");

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Choose a stronger password."),
    ).toBeInTheDocument();
    expect(users.registerUser).not.toHaveBeenCalled();
  });

  it("rejects a phone number that is not valid", async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText("First Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Last Name"), "Lovelace");
    await userEvent.type(
      screen.getByLabelText("Email address"),
      "ada@example.com",
    );
    await userEvent.type(screen.getByLabelText("Phone Number"), "+1415");
    await userEvent.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "Tr0ubad0ur-x9",
    );

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("Enter a valid international phone number."),
    ).toBeInTheDocument();
  });

  it("stops names at the length the database accepts", () => {
    renderRegister();

    expect(screen.getByLabelText("First Name")).toHaveAttribute(
      "maxlength",
      String(MAX_PERSON_NAME_LENGTH),
    );
  });

  it("marks the email field when the address is already taken", async () => {
    users.registerUser.mockRejectedValue(
      new ApiError({
        kind: "validation",
        status: 400,
        message: "Check the form.",
        fieldErrors: { email: "A user with that email already exists." },
      }),
    );
    renderRegister();
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText("Password"), "Tr0ubad0ur-x9");
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "Tr0ubad0ur-x9",
    );

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText("A user with that email already exists."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
