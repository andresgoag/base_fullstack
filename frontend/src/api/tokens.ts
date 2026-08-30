import axios from "axios";
import { API_BASE_URL } from "config";
import { API_ENDPOINTS } from "api/endpoints";
import { i18n } from "i18n/config";
import { createRequestSender, parseResponse } from "api/request";
import {
  loginResponseSchema,
  refreshResponseSchema,
  type LoginData,
  type LoginResponse,
  type RefreshResponse,
} from "models";

const tokenClient = axios.create({ baseURL: API_BASE_URL });
tokenClient.interceptors.request.use((config) => {
  config.headers.set("Accept-Language", i18n.language);
  return config;
});
const sendTokenRequest = createRequestSender(tokenClient);

export const loginUser = async (data: LoginData): Promise<LoginResponse> =>
  parseResponse(
    loginResponseSchema,
    await sendTokenRequest({
      method: "post",
      url: API_ENDPOINTS.createToken,
      data,
    }),
  );

export const refreshToken = async (refresh: string): Promise<RefreshResponse> =>
  parseResponse(
    refreshResponseSchema,
    await sendTokenRequest({
      method: "post",
      url: API_ENDPOINTS.refreshToken,
      data: { refresh },
    }),
  );

export const blacklistToken = async (refresh: string): Promise<void> => {
  await sendTokenRequest({
    method: "post",
    url: API_ENDPOINTS.blacklistToken,
    data: { refresh },
  });
};
