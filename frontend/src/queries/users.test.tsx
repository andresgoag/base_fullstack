import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContextProvider } from "context/toast/ToastContextProvider";
import { createQueryClient } from "queries/queryClient";
import { queryKeys } from "queries/queryKeys";
import { useUpdateProfile } from "queries/users";
import { ApiError } from "api/errors";
import type { User } from "models";

const users = vi.hoisted(() => ({
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
  activateAccount: vi.fn(),
  resendActivation: vi.fn(),
}));
vi.mock("api/users", () => users);

const storedUser: User = {
  id: 1,
  email: "ada@example.com",
  phone: "+14155552671",
  first_name: "Ada",
  last_name: "Lovelace",
};

const renderUpdateProfile = () => {
  const queryClient = createQueryClient(() => undefined);
  queryClient.setQueryData(queryKeys.users.current(), storedUser);
  const { result } = renderHook(() => useUpdateProfile(), {
    wrapper: ({ children }) => (
      <ToastContextProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ToastContextProvider>
    ),
  });
  return { queryClient, result };
};

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the new name before the server answers", async () => {
    users.updateProfile.mockImplementation(
      () => new Promise<User>(() => undefined),
    );
    const { queryClient, result } = renderUpdateProfile();

    result.current.mutate({
      first_name: "Grace",
      last_name: "Hopper",
      phone: "+14155550000",
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData<User>(queryKeys.users.current())?.first_name,
      ).toBe("Grace");
    });
  });

  it("puts the previous profile back when the update fails", async () => {
    users.updateProfile.mockRejectedValue(
      new ApiError({ kind: "validation", status: 400, message: "Invalid" }),
    );
    const { queryClient, result } = renderUpdateProfile();

    result.current.mutate({
      first_name: "Grace",
      last_name: "Hopper",
      phone: "+14155550000",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(
      queryClient.getQueryData<User>(queryKeys.users.current())?.first_name,
    ).toBe("Ada");
  });
});
