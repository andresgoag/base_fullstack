import { AuthContext } from "./AuthContext";
import { useState, useEffect, useCallback } from "react";
import { ACCESS_LIFETIME } from "config";
import type { LoginResponse, User } from "models";
import { useToastContext } from "context/toast/ToastContext";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { loginUser, registerUser, refreshToken, getUser } from "api/auth";

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

  const {
    mutate: login,
    isPending: isPendingLogin,
    isError: isErrorLogin,
    error: errorLogin,
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem("refresh", data.refresh);
      setAccess(data.access);
      setRefresh(data.refresh);
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
    mutationFn: registerUser,
    onSuccess: () => {
      navigate("/auth/login");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  const { mutate: refreshAccess } = useMutation({
    mutationFn: refreshToken,
    onSuccess: data => {
      setAccess(data.access);
    },
    onError: (error: Error) => {
      showToast({
        message: `${error.message}, please log in again.`,
        type: "danger",
      });
      logout();
    },
  });

  const { mutate: getCurrentUser } = useMutation({
    mutationFn: getUser,
    onSuccess: user => {
      setCurrentUser(user);
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("refresh");
    setAccess(null);
    setRefresh(null);
    navigate("/auth/login");
  }, [navigate]);

  useEffect(() => {
    const storedRefresh = localStorage.getItem("refresh");
    if (!storedRefresh) return;
    setRefresh(storedRefresh);
    refreshAccess(storedRefresh);
  }, [refreshAccess]);

  useEffect(() => {
    if (!refresh) return;
    const timeout = setTimeout(() => {
      refreshAccess(refresh);
    }, ACCESS_LIFETIME * 1000);
    return () => clearTimeout(timeout);
  }, [access, refresh, refreshAccess]);

  useEffect(() => {
    if (!access) return;
    getCurrentUser(access);
  }, [access, getCurrentUser]);

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
