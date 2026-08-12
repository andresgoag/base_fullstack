import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestTokenRefresh } from "@/api/authEndpoints";
import { refreshSession } from "./refreshSession";
import { REFRESH_STORAGE_KEY, getSession, setSession } from "./session";

vi.mock("@/api/authEndpoints", () => ({
  requestTokenRefresh: vi.fn(),
}));

const mockedRefresh = vi.mocked(requestTokenRefresh);

describe("refreshSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setSession(null);
  });

  it("shares one in-flight request across concurrent callers", async () => {
    localStorage.setItem(REFRESH_STORAGE_KEY, "stored-refresh");
    mockedRefresh.mockResolvedValue({
      access: "new-access",
      refresh: "rotated-refresh",
    });

    const results = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);

    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });

  it("persists the rotated refresh token so it is never reused", async () => {
    localStorage.setItem(REFRESH_STORAGE_KEY, "stored-refresh");
    mockedRefresh.mockResolvedValue({
      access: "new-access",
      refresh: "rotated-refresh",
    });

    await refreshSession();

    expect(getSession()).toEqual({
      access: "new-access",
      refresh: "rotated-refresh",
    });
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBe("rotated-refresh");
  });

  it("keeps the previous refresh token when the server does not rotate", async () => {
    localStorage.setItem(REFRESH_STORAGE_KEY, "stored-refresh");
    mockedRefresh.mockResolvedValue({ access: "new-access" });

    await refreshSession();

    expect(getSession()?.refresh).toBe("stored-refresh");
  });

  it("starts a fresh request once the previous one settles", async () => {
    localStorage.setItem(REFRESH_STORAGE_KEY, "stored-refresh");
    mockedRefresh.mockResolvedValue({
      access: "new-access",
      refresh: "rotated-refresh",
    });

    await refreshSession();
    await refreshSession();

    expect(mockedRefresh).toHaveBeenCalledTimes(2);
    expect(mockedRefresh).toHaveBeenLastCalledWith("rotated-refresh");
  });

  it("clears the session when the refresh token is rejected", async () => {
    localStorage.setItem(REFRESH_STORAGE_KEY, "stored-refresh");
    mockedRefresh.mockRejectedValue(new Error("token blacklisted"));

    expect(await refreshSession()).toBeNull();
    expect(getSession()).toBeNull();
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBeNull();
  });

  it("resolves to null without calling the API when there is no token", async () => {
    expect(await refreshSession()).toBeNull();
    expect(mockedRefresh).not.toHaveBeenCalled();
  });
});
