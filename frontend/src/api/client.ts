import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "config";
import { getAuthSession, refreshAuthSession } from "auth/authSession";
import { i18n } from "i18n/config";
import { createRequestSender } from "api/request";

declare module "axios" {
  interface AxiosRequestConfig {
    isRetry?: boolean;
  }
}

const withAuthorizationHeader = <Config extends InternalAxiosRequestConfig>(
  config: Config,
  accessToken: string,
): Config => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...config, headers };
};

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Accept-Language", i18n.language);
  const { access } = getAuthSession();
  const localized = { ...config, headers };
  return access ? withAuthorizationHeader(localized, access) : localized;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const failedRequest = error.config;
    const canRetry =
      error.response?.status === 401 &&
      failedRequest !== undefined &&
      !failedRequest.isRetry &&
      getAuthSession().refresh !== null;
    if (!canRetry) throw error;

    try {
      const access = await refreshAuthSession();
      return await apiClient.request({
        ...withAuthorizationHeader(failedRequest, access),
        isRetry: true,
      });
    } catch {
      throw error;
    }
  },
);

export const sendRequest = createRequestSender(apiClient);
