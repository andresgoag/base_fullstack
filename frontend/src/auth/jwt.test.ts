import { describe, expect, it } from "vitest";
import {
  getAccessTokenExpiryMs,
  getMillisecondsUntilRefresh,
  isAccessTokenExpiringSoon,
} from "auth/jwt";
import { buildAccessToken } from "test/tokens";

describe("jwt", () => {
  it("decodes payloads that use base64url characters", () => {
    const token = buildAccessToken(60_000);
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(getAccessTokenExpiryMs(token)).toBeGreaterThan(Date.now());
  });

  it("returns zero for a malformed token", () => {
    expect(getAccessTokenExpiryMs("not-a-token")).toBe(0);
  });

  it("returns zero when the payload has no numeric exp", () => {
    const payload = btoa(JSON.stringify({ token_type: "access" }));
    expect(getAccessTokenExpiryMs(`header.${payload}.signature`)).toBe(0);
  });

  it("reports a token inside the buffer window as expiring soon", () => {
    expect(isAccessTokenExpiringSoon(buildAccessToken(10_000), 30_000)).toBe(
      true,
    );
  });

  it("reports a token beyond the buffer window as fresh", () => {
    expect(isAccessTokenExpiringSoon(buildAccessToken(300_000), 30_000)).toBe(
      false,
    );
  });

  it("counts down to the refresh moment", () => {
    const delay = getMillisecondsUntilRefresh(
      buildAccessToken(300_000),
      30_000,
    );
    expect(delay).toBeGreaterThan(260_000);
    expect(delay).toBeLessThanOrEqual(270_000);
  });
});
