import * as z from "zod";
import type { TFunction } from "i18next";
import { isPasswordAcceptable } from "auth/passwordStrength";

export const MAX_PERSON_NAME_LENGTH = 150;

export const buildEmailField = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.emailRequired"))
    .pipe(z.email(t("validation.emailInvalid")));

export const buildPersonNameField = (t: TFunction, fieldKey: string) =>
  z
    .string()
    .trim()
    .min(1, t("validation.required", { field: t(fieldKey) }))
    .max(
      MAX_PERSON_NAME_LENGTH,
      t("validation.maxLength", { count: MAX_PERSON_NAME_LENGTH }),
    );

export const buildRequiredPasswordField = (message: string) =>
  z.string().min(1, message);

type PasswordRulesInput = {
  password: string;
  confirmation: string;
  passwordPath: string;
  confirmationPath: string;
  similarTo: string[];
};

export const checkPasswordRules = (
  t: TFunction,
  context: z.RefinementCtx,
  input: PasswordRulesInput,
): void => {
  if (
    input.password.length > 0 &&
    !isPasswordAcceptable(input.password, input.similarTo)
  ) {
    context.addIssue({
      code: "custom",
      path: [input.passwordPath],
      message: t("validation.passwordTooWeak"),
    });
  }
  if (input.confirmation.length > 0 && input.confirmation !== input.password) {
    context.addIssue({
      code: "custom",
      path: [input.confirmationPath],
      message: t("validation.passwordsDoNotMatch"),
    });
  }
};
