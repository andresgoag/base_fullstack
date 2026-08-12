import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestTokenRefresh } from "@/api/authEndpoints";
import { apiClient } from "@/api/client";
import { REFRESH_STORAGE_KEY, getSession, setSession } from "@/auth/session";

vi.mock("@/api/authEndpoints", () => ({
  requestTokenRefresh: vi.fn(),
}));

const mockedRefresh = vi.mocked(requestTokenRefresh);

type RecordedRequest = {
  authorization?: string;
};

const recordedRequests: RecordedRequest[] = [];

const respondWith = (statuses: number[]) => {
  let callIndex = 0;
  apiClient.defaults.adapter = async (config) => {
    recordedRequests.push({
      authorization: config.headers?.Authorization as string | undefined,
    });
    const status = statuses[Math.min(callIndex, statuses.length - 1)];
    callIndex += 1;
    if (status >= 400) {
      const error = new Error(
        `Request failed with status ${status}`,
      ) as Error & {
        isAxiosError: boolean;
        response: unknown;
        config: unknown;
      };
      error.isAxiosError = true;
      error.config = config;
      error.response = { status, data: {}, headers: {}, config };
      throw error;
    }
    return {
      data: { ok: true },
      status,
      statusText: "OK",
      headers: {},
      config,
    };
  };
};

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordedRequests.length = 0;
    localStorage.clear();
    setSession(null);
  });

  it("attaches the current access token", async () => {
    setSession({ access: "access-1", refresh: "refresh-1" });
    respondWith([200]);

    await apiClient.get("/auth/users/me/");

    expect(recordedRequests[0].authorization).toBe("Bearer access-1");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    setSession({ access: "expired-access", refresh: "refresh-1" });
    mockedRefresh.mockResolvedValue({
      access: "access-2",
      refresh: "refresh-2",
    });
    respondWith([401, 200]);

    const response = await apiClient.get("/auth/users/me/");

    expect(response.status).toBe(200);
    expect(recordedRequests[0].authorization).toBe("Bearer expired-access");
    expect(recordedRequests[1].authorization).toBe("Bearer access-2");
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });

  it("persists the rotated refresh token after a 401 retry", async () => {
    setSession({ access: "expired-access", refresh: "refresh-1" });
    mockedRefresh.mockResolvedValue({
      access: "access-2",
      refresh: "refresh-2",
    });
    respondWith([401, 200]);

    await apiClient.get("/auth/users/me/");

    expect(getSession()?.refresh).toBe("refresh-2");
    expect(localStorage.getItem(REFRESH_STORAGE_KEY)).toBe("refresh-2");
  });

  it("refreshes only once for concurrent 401s", async () => {
    setSession({ access: "expired-access", refresh: "refresh-1" });
    mockedRefresh.mockResolvedValue({
      access: "access-2",
      refresh: "refresh-2",
    });
    respondWith([401, 401, 200]);

    const responses = await Promise.all([
      apiClient.get("/one/"),
      apiClient.get("/two/"),
    ]);

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not retry more than once", async () => {
    setSession({ access: "expired-access", refresh: "refresh-1" });
    mockedRefresh.mockResolvedValue({
      access: "access-2",
      refresh: "refresh-2",
    });
    respondWith([401]);

    await expect(apiClient.get("/auth/users/me/")).rejects.toThrow();
    expect(recordedRequests).toHaveLength(2);
  });

  it("gives up when the refresh itself fails", async () => {
    setSession({ access: "expired-access", refresh: "refresh-1" });
    mockedRefresh.mockRejectedValue(new Error("blacklisted"));
    respondWith([401]);

    await expect(apiClient.get("/auth/users/me/")).rejects.toThrow();
    expect(getSession()).toBeNull();
  });
});
