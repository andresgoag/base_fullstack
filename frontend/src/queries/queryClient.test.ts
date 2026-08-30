import { describe, expect, it } from "vitest";
import { ApiError } from "api/errors";
import { shouldRetryRequest } from "queries/queryClient";

const buildError = (kind: "network" | "server" | "validation"): ApiError =>
  new ApiError({ kind, status: null, message: "failed" });

describe("shouldRetryRequest", () => {
  it("retries a network failure", () => {
    expect(shouldRetryRequest(0, buildError("network"))).toBe(true);
  });

  it("retries a server failure", () => {
    expect(shouldRetryRequest(1, buildError("server"))).toBe(true);
  });

  it("stops retrying after the limit", () => {
    expect(shouldRetryRequest(2, buildError("network"))).toBe(false);
  });

  it("never retries a validation failure", () => {
    expect(shouldRetryRequest(0, buildError("validation"))).toBe(false);
  });

  it("never retries an error it does not understand", () => {
    expect(shouldRetryRequest(0, new Error("boom"))).toBe(false);
  });
});
