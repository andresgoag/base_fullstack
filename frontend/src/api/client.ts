import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config";
import { refreshSession } from "@/auth/refreshSession";
import { getSession } from "@/auth/session";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  hasRetried?: boolean;
};

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.access}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }
    const request = error.config as RetriableRequestConfig | undefined;
    if (!request || request.hasRetried) {
      throw error;
    }
    request.hasRetried = true;

    const session = await refreshSession();
    if (!session) {
      throw error;
    }
    request.headers.Authorization = `Bearer ${session.access}`;
    return apiClient(request);
  },
);
