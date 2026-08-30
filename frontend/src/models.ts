import * as z from "zod";
import type { components } from "api/schema";

type ApiSchemas = components["schemas"];

const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

export const MAX_PERSON_NAME_LENGTH = 150;

export const userSchema: z.ZodType<ApiSchemas["User"]> = z.object({
  id: z.number(),
  email: z.email(),
  phone: z.string().regex(E164_PATTERN),
  first_name: z.string().max(MAX_PERSON_NAME_LENGTH),
  last_name: z.string().max(MAX_PERSON_NAME_LENGTH),
});

export const loginResponseSchema: z.ZodType<ApiSchemas["TokenObtainPair"]> =
  z.object({
    access: z.string(),
    refresh: z.string(),
  });

export const refreshResponseSchema: z.ZodType<ApiSchemas["TokenRefresh"]> =
  z.object({
    access: z.string(),
    refresh: z.string(),
  });

export const similarCommentSchema: z.ZodType<ApiSchemas["SimilarComment"]> =
  z.object({
    id: z.number(),
    text: z.string(),
    created_at: z.iso.datetime({ offset: true }),
    distance: z.number(),
  });

export const similarCommentListSchema = z.array(similarCommentSchema);

export type User = ApiSchemas["User"];
export type LoginResponse = ApiSchemas["TokenObtainPair"];
export type RefreshResponse = ApiSchemas["TokenRefresh"];
export type SimilarComment = ApiSchemas["SimilarComment"];

export type LoginData = ApiSchemas["TokenObtainPairRequest"];
export type ProfileUpdateData = Omit<
  Required<ApiSchemas["PatchedUserRequest"]>,
  "email"
>;
export type ChangePasswordData = ApiSchemas["SetPasswordRetypeRequest"];
export type PasswordResetRequestData = ApiSchemas["SendEmailResetRequest"];
export type ResendActivationData = ApiSchemas["SendEmailResetRequest"];
export type ActivationData = ApiSchemas["ActivationRequest"];
export type PasswordResetConfirmData =
  ApiSchemas["PasswordResetConfirmRetypeRequest"];
export type PasswordResetFormData = Omit<
  PasswordResetConfirmData,
  "uid" | "token"
>;

export type RegisterData = ApiSchemas["UserCreatePasswordRetypeRequest"];

export interface SimilarCommentQuery {
  text: string;
}
