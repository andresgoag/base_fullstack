import { isValidPhoneNumber } from "react-phone-number-input";
import type { TFunction } from "i18next";
import * as z from "zod";

export const buildPhoneField = (t: TFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.phoneRequired"))
    .refine((value) => isValidPhoneNumber(value), t("validation.phoneInvalid"));
