import { describe, expect, it } from "vitest";
import {
  evaluatePasswordStrength,
  isPasswordAcceptable,
} from "auth/passwordStrength";

describe("passwordStrength", () => {
  it("rejects passwords shorter than the Django minimum", () => {
    expect(isPasswordAcceptable("Short1!")).toBe(false);
    expect(
      evaluatePasswordStrength("Short1!").problems.map(
        (problem) => problem.key,
      ),
    ).toContain("passwordStrength.problem.minimumLength");
  });

  it("rejects entirely numeric passwords", () => {
    expect(isPasswordAcceptable("12345678901")).toBe(false);
  });

  it("rejects common passwords", () => {
    expect(isPasswordAcceptable("password")).toBe(false);
  });

  it("rejects passwords similar to the user's own attributes", () => {
    expect(isPasswordAcceptable("andresgoag99", ["andresgoag@mail.com"])).toBe(
      false,
    );
  });

  it("accepts a password that satisfies every validator", () => {
    expect(isPasswordAcceptable("Tr0ubad0ur-x9")).toBe(true);
  });

  it("scores an empty password as blank", () => {
    expect(evaluatePasswordStrength("")).toMatchObject({
      score: 0,
      labelKey: "",
    });
  });

  it("grades a long varied password as strong", () => {
    expect(evaluatePasswordStrength("Tr0ubad0ur-x9!")).toMatchObject({
      labelKey: "passwordStrength.strong",
      variant: "success",
    });
  });
});
