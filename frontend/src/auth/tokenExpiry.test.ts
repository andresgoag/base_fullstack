import { getAccessTokenExpiry } from "./tokenExpiry";

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const buildToken = (claims: Record<string, unknown>) =>
  `header.${encodeBase64Url(JSON.stringify(claims))}.signature`;

describe("getAccessTokenExpiry", () => {
  it("returns the expiry in milliseconds", () => {
    expect(getAccessTokenExpiry(buildToken({ exp: 1700000000 }))).toBe(
      1700000000000,
    );
  });

  it("decodes payloads containing base64url characters", () => {
    const claims = { exp: 1700000000, note: "a>b?c>d?e>f?" };
    const payload = encodeBase64Url(JSON.stringify(claims));
    expect(payload).toMatch(/[-_]/);
    expect(getAccessTokenExpiry(`header.${payload}.signature`)).toBe(
      1700000000000,
    );
  });

  it("returns null for a malformed token instead of a zero expiry", () => {
    expect(getAccessTokenExpiry("not-a-token")).toBeNull();
    expect(
      getAccessTokenExpiry("header.!!!not-base64!!!.signature"),
    ).toBeNull();
  });

  it("returns null when the payload has no numeric exp", () => {
    expect(getAccessTokenExpiry(buildToken({ sub: "1" }))).toBeNull();
  });
});
