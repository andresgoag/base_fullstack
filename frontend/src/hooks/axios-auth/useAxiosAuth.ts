import axios from "axios";
import { API_BASE_URL } from "config";
import { useAuthContext } from "context/auth/AuthContext";
import { useMemo, useRef } from "react";
import { refreshToken } from "api/auth";

export const useAxiosAuth = () => {
  const { access, refresh } = useAuthContext();
  const isRefreshing = useRef(false);

  const axiosAuth = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL });

    instance.interceptors.request.use((config) => {
      if (access) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${access}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refresh
        ) {
          if (isRefreshing.current) {
            return Promise.reject(error);
          }
          originalRequest._retry = true;
          isRefreshing.current = true;
          try {
            const data = await refreshToken(refresh);
            originalRequest.headers["Authorization"] = `Bearer ${data.access}`;
            return instance(originalRequest);
          } catch {
            return Promise.reject(error);
          } finally {
            isRefreshing.current = false;
          }
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }, [access, refresh]);

  return { axiosAuth };
};
