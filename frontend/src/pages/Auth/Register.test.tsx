import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./Register";
import { AuthContext } from "@/context/auth/AuthContext";

type AuthContextValue = NonNullable<React.ContextType<typeof AuthContext>>;

const renderRegisterForm = () => {
  const mutate = vi.fn();
  const value = {
    session: null,
    currentUser: null,
    isLoadingUser: false,
    isInitializing: false,
    login: {} as AuthContextValue["login"],
    register: {
      mutate,
      isPending: false,
    } as unknown as AuthContextValue["register"],
    logout: () => {},
  } as AuthContextValue;

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { mutate };
};

const fillRequiredFields = async (password: string, confirmation: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("First Name"), "Ada");
  await user.type(screen.getByLabelText("Last Name"), "Lovelace");
  await user.type(screen.getByLabelText("Email address"), "ada@example.com");
  await user.type(screen.getByLabelText("Phone Number"), "+14155552671");
  await user.type(screen.getByLabelText("Password"), password);
  if (confirmation) {
    await user.type(screen.getByLabelText("Confirm Password"), confirmation);
  }
  await user.click(screen.getByRole("button", { name: "Register" }));
};

describe("RegisterForm", () => {
  it("blocks submission when the confirmation does not match", async () => {
    const { mutate } = renderRegisterForm();

    await fillRequiredFields("Str0ngP@ssword!", "Str0ngP@ssword?");

    expect(await screen.findByText("Passwords do not match.")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits the confirmation the backend requires", async () => {
    const { mutate } = renderRegisterForm();

    await fillRequiredFields("Str0ngP@ssword!", "Str0ngP@ssword!");

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        password: "Str0ngP@ssword!",
        re_password: "Str0ngP@ssword!",
      }),
    );
  });

  it("requires the confirmation field", async () => {
    const { mutate } = renderRegisterForm();

    await fillRequiredFields("Str0ngP@ssword!", "");

    expect(
      await screen.findByText("Please confirm your password."),
    ).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });
});
