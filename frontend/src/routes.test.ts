import { describe, expect, it } from "vitest";
import { getRedirectTarget, resolveInternalPath, ROUTES } from "routes";

describe("resolveInternalPath", () => {
  it("keeps an internal path", () => {
    expect(resolveInternalPath("/reports?page=2")).toBe("/reports?page=2");
  });

  it("rejects a protocol relative path", () => {
    expect(resolveInternalPath("//evil.example.com")).toBe(ROUTES.dashboard);
  });

  it("rejects a backslash escaped path", () => {
    expect(resolveInternalPath("/\\evil.example.com")).toBe(ROUTES.dashboard);
  });

  it("rejects an absolute url", () => {
    expect(resolveInternalPath("https://evil.example.com")).toBe(
      ROUTES.dashboard,
    );
  });

  it("falls back for a value that is not a string", () => {
    expect(resolveInternalPath(42)).toBe(ROUTES.dashboard);
  });
});

describe("getRedirectTarget", () => {
  it("reads the remembered destination", () => {
    expect(getRedirectTarget({ from: "/account" })).toBe("/account");
  });

  it("falls back when there is no state", () => {
    expect(getRedirectTarget(null)).toBe(ROUTES.dashboard);
  });

  it("falls back for an external destination", () => {
    expect(getRedirectTarget({ from: "//evil.example.com" })).toBe(
      ROUTES.dashboard,
    );
  });
});
