import { describe, expect, it } from "vitest";
import * as z from "zod";
import {
  buildEmailField,
  buildPersonNameField,
  checkPasswordRules,
  MAX_PERSON_NAME_LENGTH,
} from "validation";
import { translate } from "i18n/config";

const emailField = buildEmailField(translate);

describe("emailField", () => {
  it("trims what the visitor typed", () => {
    expect(emailField.parse("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("rejects an address without a domain", () => {
    expect(emailField.safeParse("ada@").success).toBe(false);
  });

  it("reports a missing address", () => {
    const result = emailField.safeParse("   ");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Email is required.");
  });
});

describe("buildPersonNameField", () => {
  const field = buildPersonNameField(translate, "validation.firstName");

  it("names the field in the required message", () => {
    expect(field.safeParse("").error?.issues[0].message).toBe(
      "First name is required.",
    );
  });

  it("stops at the length the database accepts", () => {
    expect(field.safeParse("a".repeat(MAX_PERSON_NAME_LENGTH)).success).toBe(
      true,
    );
    expect(
      field.safeParse("a".repeat(MAX_PERSON_NAME_LENGTH + 1)).success,
    ).toBe(false);
  });

  it("trims surrounding spaces", () => {
    expect(field.parse("  Ada  ")).toBe("Ada");
  });
});

const buildSchema = (similarTo: string[]) =>
  z
    .object({ password: z.string(), confirmation: z.string() })
    .superRefine((values, context) => {
      checkPasswordRules(translate, context, {
        password: values.password,
        confirmation: values.confirmation,
        passwordPath: "password",
        confirmationPath: "confirmation",
        similarTo,
      });
    });

describe("checkPasswordRules", () => {
  it("accepts a strong password typed twice", () => {
    const result = buildSchema([]).safeParse({
      password: "Tr0ubad0ur-x9",
      confirmation: "Tr0ubad0ur-x9",
    });
    expect(result.success).toBe(true);
  });

  it("reports a mismatch on the confirmation field", () => {
    const result = buildSchema([]).safeParse({
      password: "Tr0ubad0ur-x9",
      confirmation: "something else",
    });
    expect(result.error?.issues[0].path).toEqual(["confirmation"]);
    expect(result.error?.issues[0].message).toBe("Passwords do not match.");
  });

  it("reports a weak password on the password field", () => {
    const result = buildSchema([]).safeParse({
      password: "12345678",
      confirmation: "12345678",
    });
    expect(result.error?.issues[0].path).toEqual(["password"]);
  });

  it("rejects a password built from the visitor's own details", () => {
    const result = buildSchema(["ada@example.com"]).safeParse({
      password: "example-2026",
      confirmation: "example-2026",
    });
    expect(result.success).toBe(false);
  });
});
