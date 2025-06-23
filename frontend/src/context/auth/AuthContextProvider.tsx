import { AuthContext } from "./AuthContext";
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, ACCESS_LIFETIME } from "config";
import axios from "axios";
import type { LoginData, RegisterData } from "context/auth/AuthContext";
import type { LoginResponse, User, RegisterResponse } from "models";
import { useToastContext } from "context/toast/ToastContext";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

export type LoginProps = {
  onSuccess: (data: LoginResponse) => void;
  onError?: (error: Error) => void;
};

type ContextProps = {
  children: React.ReactNode;
};

export const AuthContextProvider = ({ children }: ContextProps) => {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const loginApi = async (data: LoginData): Promise<LoginResponse> => {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/jwt/create/`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || "Login failed");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
  };

  const registerApi = async (data: RegisterData): Promise<RegisterResponse> => {
    try {
      const response = await axios.post<RegisterResponse>(
        `${API_BASE_URL}/auth/users/`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || "Register failed");
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
  };

  const logout = useCallback(() => {
    setAccess(null);
    setRefresh(null);
    navigate("/auth/login");
  }, [navigate]);

  const onLoginSuccess = useCallback((data: LoginResponse) => {
    setAccess(data.access);
    setRefresh(data.refresh);
  }, []);

  const {
    mutate: login,
    isPending: isPendingLogin,
    isError: isErrorLogin,
    error: errorLogin,
  } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data: LoginResponse) => {
      onLoginSuccess(data);
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  const {
    mutate: register,
    isPending: isPendingRegister,
    isError: isErrorRegister,
    error: errorRegister,
  } = useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      navigate("/auth/login");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  useEffect(() => {
    if (!refresh) return;
    const refreshTokenApi = async (): Promise<undefined> => {
      try {
        const response = await axios.post<LoginResponse>(
          `${API_BASE_URL}/auth/jwt/refresh/`,
          { refresh }
        );
        onLoginSuccess({ ...response.data, refresh });
      } catch {
        showToast({
          message: "Please log in again.",
          type: "danger",
        });
        logout();
      }
    };
    setTimeout(() => {
      refreshTokenApi();
    }, ACCESS_LIFETIME * 1000);
  }, [access, refresh, showToast, logout, onLoginSuccess]);

  useEffect(() => {
    if (!access) return;
    const getCurrentUser = async () => {
      try {
        const response = await axios.get<User>(
          `${API_BASE_URL}/auth/users/me/`,
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );
        setCurrentUser(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          showToast({
            message:
              error.response?.data?.detail || "Failed to fetch user data",
            type: "danger",
          });
        } else {
          showToast({
            message: "An unexpected error occurred while fetching user data",
            type: "danger",
          });
        }
      }
    };
    getCurrentUser();
  }, [access, setCurrentUser, showToast]);

  return (
    <AuthContext.Provider
      value={{
        access,
        refresh,
        login,
        isPendingLogin,
        isErrorLogin,
        errorLogin,
        logout,
        currentUser,
        register,
        isPendingRegister,
        isErrorRegister,
        errorRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
