import { sendRequest } from "api/client";
import { API_ENDPOINTS } from "api/endpoints";
import { parseResponse, type RequestOptions } from "api/request";
import {
  userSchema,
  type ActivationData,
  type ChangePasswordData,
  type PasswordResetConfirmData,
  type PasswordResetRequestData,
  type ProfileUpdateData,
  type RegisterData,
  type ResendActivationData,
  type User,
} from "models";

export const registerUser = async (data: RegisterData): Promise<User> =>
  parseResponse(
    userSchema,
    await sendRequest({ method: "post", url: API_ENDPOINTS.users, data }),
  );

export const getCurrentUser = async ({
  signal,
}: RequestOptions = {}): Promise<User> =>
  parseResponse(
    userSchema,
    await sendRequest({
      method: "get",
      url: API_ENDPOINTS.currentUser,
      signal,
    }),
  );

export const updateProfile = async (data: ProfileUpdateData): Promise<User> =>
  parseResponse(
    userSchema,
    await sendRequest({
      method: "patch",
      url: API_ENDPOINTS.currentUser,
      data,
    }),
  );

export const changePassword = async (
  data: ChangePasswordData,
): Promise<void> => {
  await sendRequest({ method: "post", url: API_ENDPOINTS.setPassword, data });
};

export const requestPasswordReset = async (
  data: PasswordResetRequestData,
): Promise<void> => {
  await sendRequest({
    method: "post",
    url: API_ENDPOINTS.requestPasswordReset,
    data,
  });
};

export const confirmPasswordReset = async (
  data: PasswordResetConfirmData,
): Promise<void> => {
  await sendRequest({
    method: "post",
    url: API_ENDPOINTS.confirmPasswordReset,
    data,
  });
};

export const activateAccount = async (data: ActivationData): Promise<void> => {
  await sendRequest({ method: "post", url: API_ENDPOINTS.activate, data });
};

export const resendActivation = async (
  data: ResendActivationData,
): Promise<void> => {
  await sendRequest({
    method: "post",
    url: API_ENDPOINTS.resendActivation,
    data,
  });
};
