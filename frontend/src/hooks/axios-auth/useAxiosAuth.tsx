import axios from "axios";
import { API_BASE_URL } from "config";
import { useAuthContext } from "context/auth/AuthContext";
import { useToastContext } from "context/toast/ToastContext";
import { useMemo } from "react";

export const useAxiosAuth = () => {
  const { access } = useAuthContext();
  const { showToast } = useToastContext();

  const axiosAuth = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
    });
    instance.interceptors.request.use(
      config => {
        if (!access) {
          showToast({
            type: "danger",
            message: "You must be logged in to perform this action.",
          });
          return Promise.reject(new Error("No access token found"));
        }
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${access}`;
        return config;
      },
      error => Promise.reject(error)
    );
    return instance;
  }, [access, showToast]);

  return { axiosAuth };
};
