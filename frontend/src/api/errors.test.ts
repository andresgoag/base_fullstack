import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { ApiError, toApiError, toContractError } from "api/errors";

const buildAxiosError = (data: unknown, status = 400): AxiosError => {
  const error = new AxiosError("Request failed");
  error.response = {
    data,
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe("toApiError", () => {
  it("classifies a response without a status as a network failure", () => {
    const error = toApiError(new AxiosError("Network Error"));
    expect(error.kind).toBe("network");
    expect(error.status).toBeNull();
    expect(error.isRetryable).toBe(true);
  });

  it("classifies a server failure as retryable", () => {
    const error = toApiError(buildAxiosError({ detail: "boom" }, 500));
    expect(error.kind).toBe("server");
    expect(error.isRetryable).toBe(true);
  });

  it("hides the server message behind a generic one for server failures", () => {
    const error = toApiError(buildAxiosError({ detail: "stack trace" }, 500));
    expect(error.message).not.toContain("stack trace");
  });

  it("classifies an unauthorized response", () => {
    const error = toApiError(buildAxiosError({ detail: "No account" }, 401));
    expect(error.kind).toBe("authentication");
    expect(error.isExpected).toBe(true);
    expect(error.isRetryable).toBe(false);
  });

  it("keeps field errors addressable by field name", () => {
    const error = toApiError(
      buildAxiosError({ email: ["Already taken"], phone: ["Invalid"] }),
    );
    expect(error.kind).toBe("validation");
    expect(error.fieldErrors).toEqual({
      email: "Already taken",
      phone: "Invalid",
    });
  });

  it("reads the detail field as the message", () => {
    expect(toApiError(buildAxiosError({ detail: "No account" })).message).toBe(
      "No account",
    );
  });

  it("joins non field errors", () => {
    expect(
      toApiError(buildAxiosError({ non_field_errors: ["a", "b"] })).message,
    ).toBe("a b");
  });

  it("keeps non field keys out of the field errors", () => {
    expect(toApiError(buildAxiosError({ detail: "nope" })).fieldErrors).toEqual(
      {},
    );
  });

  it("falls back to the field messages when there is no detail", () => {
    expect(
      toApiError(buildAxiosError({ email: ["Already taken"] })).message,
    ).toBe("Already taken");
  });

  it("passes through string bodies", () => {
    expect(toApiError(buildAxiosError("Service unavailable")).message).toBe(
      "Service unavailable",
    );
  });

  it("falls back for errors that did not come from axios", () => {
    const error = toApiError(new Error("boom"));
    expect(error.kind).toBe("unknown");
    expect(error.isRetryable).toBe(false);
  });

  it("returns an existing api error untouched", () => {
    const original = toContractError(new Error("bad shape"));
    expect(toApiError(original)).toBe(original);
  });

  it("attaches the original error as the cause", () => {
    const original = buildAxiosError({ detail: "nope" });
    expect(toApiError(original).cause).toBe(original);
  });

  it("builds an api error instance", () => {
    expect(toApiError(buildAxiosError({}))).toBeInstanceOf(ApiError);
  });
});

describe("toContractError", () => {
  it("marks unexpected payloads as a contract failure", () => {
    const error = toContractError(new Error("bad shape"));
    expect(error.kind).toBe("contract");
    expect(error.isRetryable).toBe(false);
    expect(error.isExpected).toBe(false);
  });
});
