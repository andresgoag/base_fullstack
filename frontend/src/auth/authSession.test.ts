import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAccessToken } from "test/tokens";

const refreshToken = vi.hoisted(() => vi.fn());
vi.mock("api/tokens", () => ({ refreshToken }));

const SESSION_STORAGE_KEY = "auth.session";

const loadStore = async () => {
  vi.resetModules();
  return import("auth/authSession");
};

const storedSession = () =>
  JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? "null") as {
    access: string | null;
    refresh: string | null;
  } | null;

describe("authSession", () => {
  beforeEach(() => {
    localStorage.clear();
    refreshToken.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts empty when nothing is stored", async () => {
    const store = await loadStore();
    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("restores a stored session on load", async () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ access: "a", refresh: "r" }),
    );
    const store = await loadStore();
    expect(store.getAuthSession()).toEqual({ access: "a", refresh: "r" });
  });

  it("ignores corrupted stored sessions", async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, "{not json");
    const store = await loadStore();
    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("persists and notifies on start", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribeToAuthSession(listener);
    store.startAuthSession({ access: "a", refresh: "r" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(storedSession()).toEqual({ access: "a", refresh: "r" });
  });

  it("clears storage on end", async () => {
    const store = await loadStore();
    store.startAuthSession({ access: "a", refresh: "r" });
    store.endAuthSession();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("stops notifying after unsubscribe", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribeToAuthSession(listener)();
    store.startAuthSession({ access: "a", refresh: "r" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("persists the rotated refresh token", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const store = await loadStore();
    store.startAuthSession({ access: "a1", refresh: "r1" });
    await store.refreshAuthSession();
    expect(storedSession()).toEqual({ access: "a2", refresh: "r2" });
  });

  it("keeps the current refresh token when the server does not rotate", async () => {
    refreshToken.mockResolvedValue({ access: "a2" });
    const store = await loadStore();
    store.startAuthSession({ access: "a1", refresh: "r1" });
    await store.refreshAuthSession();
    expect(store.getAuthSession()).toEqual({ access: "a2", refresh: "r1" });
  });

  it("deduplicates concurrent refreshes into a single request", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const store = await loadStore();
    store.startAuthSession({ access: "a1", refresh: "r1" });
    await Promise.all([
      store.refreshAuthSession(),
      store.refreshAuthSession(),
      store.refreshAuthSession(),
    ]);
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it("allows a new refresh after the previous one settles", async () => {
    refreshToken.mockResolvedValue({ access: "a2", refresh: "r2" });
    const store = await loadStore();
    store.startAuthSession({ access: "a1", refresh: "r1" });
    await store.refreshAuthSession();
    await store.refreshAuthSession();
    expect(refreshToken).toHaveBeenCalledTimes(2);
    expect(refreshToken).toHaveBeenLastCalledWith("r2");
  });

  it("ends the session when refreshing fails", async () => {
    refreshToken.mockRejectedValue(new Error("token blacklisted"));
    const store = await loadStore();
    store.startAuthSession({ access: "a1", refresh: "r1" });
    await expect(store.refreshAuthSession()).rejects.toThrow(
      "token blacklisted",
    );
    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("rejects when there is no refresh token", async () => {
    const store = await loadStore();
    await expect(store.refreshAuthSession()).rejects.toThrow(
      "The session has no refresh token.",
    );
  });

  it("needs a restore when the access token is missing or stale", async () => {
    const store = await loadStore();
    expect(store.needsSessionRestore()).toBe(false);
    store.startAuthSession({ access: null, refresh: "r1" });
    expect(store.needsSessionRestore()).toBe(true);
    store.startAuthSession({ access: buildAccessToken(10_000), refresh: "r1" });
    expect(store.needsSessionRestore()).toBe(true);
    store.startAuthSession({
      access: buildAccessToken(300_000),
      refresh: "r1",
    });
    expect(store.needsSessionRestore()).toBe(false);
  });

  it("does not refresh a session that is still fresh", async () => {
    const store = await loadStore();
    store.startAuthSession({
      access: buildAccessToken(300_000),
      refresh: "r1",
    });
    await store.ensureFreshAccessToken();
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it("swallows failures when ensuring a fresh token", async () => {
    refreshToken.mockRejectedValue(new Error("expired"));
    const store = await loadStore();
    store.startAuthSession({ access: null, refresh: "r1" });
    await expect(store.ensureFreshAccessToken()).resolves.toBeUndefined();
    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
  });

  it("adopts a session written by another tab", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribeToAuthSession(listener);
    const stop = store.subscribeToSessionChangesInOtherTabs();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify({ access: "a9", refresh: "r9" }),
      }),
    );

    expect(store.getAuthSession()).toEqual({ access: "a9", refresh: "r9" });
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });

  it("signs out when another tab clears the session", async () => {
    const store = await loadStore();
    store.startAuthSession({ access: "a", refresh: "r" });
    const stop = store.subscribeToSessionChangesInOtherTabs();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SESSION_STORAGE_KEY,
        newValue: null,
      }),
    );

    expect(store.getAuthSession()).toEqual({ access: null, refresh: null });
    stop();
  });

  it("ignores unrelated storage keys", async () => {
    const store = await loadStore();
    store.startAuthSession({ access: "a", refresh: "r" });
    const stop = store.subscribeToSessionChangesInOtherTabs();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: "dark" }),
    );

    expect(store.getAuthSession()).toEqual({ access: "a", refresh: "r" });
    stop();
  });
});
