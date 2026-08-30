import { describe, expect, it } from "vitest";
import { ApiError } from "api/errors";
import { readServerFormErrors } from "forms/serverErrors";

const FIELDS = ["email", "password"] as const;

const buildError = (fieldErrors: Record<string, string>, message = "Failed") =>
  new ApiError({ kind: "validation", status: 400, message, fieldErrors });

describe("readServerFormErrors", () => {
  it("maps a field the form owns", () => {
    const result = readServerFormErrors(
      buildError({ email: "Already taken" }),
      FIELDS,
    );
    expect(result.fieldErrors).toEqual([
      { field: "email", message: "Already taken" },
    ]);
    expect(result.formMessage).toBeNull();
  });

  it("keeps the banner when the server names a field the form does not have", () => {
    const result = readServerFormErrors(
      buildError({ nickname: "Not allowed" }, "Check the form."),
      FIELDS,
    );
    expect(result.fieldErrors).toEqual([]);
    expect(result.formMessage).toBe("Check the form.");
  });

  it("keeps the banner when only some fields could be mapped", () => {
    const result = readServerFormErrors(
      buildError({ email: "Already taken", nickname: "Not allowed" }),
      FIELDS,
    );
    expect(result.fieldErrors).toHaveLength(1);
    expect(result.formMessage).toBe("Failed");
  });

  it("falls back to the message for an error without field details", () => {
    const result = readServerFormErrors(
      new ApiError({ kind: "server", status: 500, message: "Server error" }),
      FIELDS,
    );
    expect(result.formMessage).toBe("Server error");
  });

  it("reads a plain error", () => {
    const result = readServerFormErrors(new Error("boom"), FIELDS);
    expect(result.formMessage).toBe("boom");
  });
});
