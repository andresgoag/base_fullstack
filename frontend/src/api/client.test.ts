import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AxiosAdapter,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const refreshToken = vi.hoisted(() => vi.fn());
vi.mock("api/tokens", () => ({ refreshToken }));

const SESSION_STORAGE_KEY = "auth.session";

type RecordedRequest = {
  url?: string;
  authorization?: string;
  isRetry?: boolean;
};

const loadClient = async () => {
  vi.resetModules();
  const session = await import("auth/authSession");
  const { apiClient } = await import("api/client");
  return { session, apiClient };
};

const installAdapter = (
  apiClient: AxiosInstance,
  statuses: number[],
  recorded: RecordedRequest[],
) => {
  let call = 0;
  apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
    const status = statuses[Math.min(call, statuses.length - 1)];
    call += 1;
    recorded.push({
      url: config.url,
      authorization: config.headers.get("Authorization") as string | undefined,
      isRetry: config.isRetry,
    });
    const response = {
      data: { ok: status < 400 },
      status,
      statusText: "",
      headers: {},
      config,
    };
    return status < 400
      ? Promise.resolve(response)
      : Promise.reject(
          Object.assign(new Error("Request failed"), {
            isAxiosError: true,
            config,
            response,
          }),
        );
  }) as AxiosAdapter;
};

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    refreshToken.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends no Authorization header when signed out", async () => {
    const { apiClient } = await loadClient();
    const recorded: RecordedRequest[] = [];
    installAdapter(apiClient, [200], recorded);

    await apiClient.get("/comments/");

    expect(recorded[0].authorization).toBeUndefined();
  });

  it("attaches the access token to every request", async () => {
    const { session, apiClient } = await loadClient();
    const recorded: RecordedRequest[] = [];
    installAdapter(apiClient, [200], recorded);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await apiClient.get("/comments/");

    expect(recorded[0].authorization).toBe("Bearer a1");
  });

  it("refreshes once on 401 and replays the request with the new token", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const { session, apiClient } = await loadClient();
    const recorded: RecordedRequest[] = [];
    installAdapter(apiClient, [401, 200], recorded);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    const response = await apiClient.get("/comments/");

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(recorded).toHaveLength(2);
    expect(recorded[1].authorization).toBe("Bearer a2");
    expect(recorded[1].isRetry).toBe(true);
    expect(response.status).toBe(200);
  });

  it("persists the rotated refresh token after a replay", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const { session, apiClient } = await loadClient();
    installAdapter(apiClient, [401, 200], []);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await apiClient.get("/comments/");

    expect(session.getAuthSession()).toEqual({ access: "a2", refresh: "r2" });
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe(
      JSON.stringify({ access: "a2", refresh: "r2" }),
    );
  });

  it("refreshes only once for concurrent 401s", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const { session, apiClient } = await loadClient();
    const recorded: RecordedRequest[] = [];
    installAdapter(apiClient, [401, 401, 401, 200], recorded);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await Promise.all([
      apiClient.get("/one/"),
      apiClient.get("/two/"),
      apiClient.get("/three/"),
    ]);

    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it("does not retry a request that already retried", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const { session, apiClient } = await loadClient();
    const recorded: RecordedRequest[] = [];
    installAdapter(apiClient, [401, 401], recorded);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await expect(apiClient.get("/comments/")).rejects.toThrow();

    expect(recorded).toHaveLength(2);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it("does not attempt a refresh when there is no refresh token", async () => {
    const { session, apiClient } = await loadClient();
    installAdapter(apiClient, [401], []);
    session.startAuthSession({ access: "a1", refresh: null });

    await expect(apiClient.get("/comments/")).rejects.toThrow();

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it("ends the session and surfaces the original error when refreshing fails", async () => {
    refreshToken.mockRejectedValue(new Error("blacklisted"));
    const { session, apiClient } = await loadClient();
    installAdapter(apiClient, [401], []);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await expect(apiClient.get("/comments/")).rejects.toThrow("Request failed");

    expect(session.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("leaves non-401 failures untouched", async () => {
    const { session, apiClient } = await loadClient();
    installAdapter(apiClient, [500], []);
    session.startAuthSession({ access: "a1", refresh: "r1" });

    await expect(apiClient.get("/comments/")).rejects.toThrow();

    expect(refreshToken).not.toHaveBeenCalled();
  });
});
