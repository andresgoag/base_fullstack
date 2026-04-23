import { AuthContext } from "./AuthContext";
import { useState, useEffect, useCallback } from "react";
import type { LoginResponse, User } from "models";
import { useToastContext } from "context/toast/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  loginUser,
  registerUser,
  refreshToken,
  getUser,
  blacklistToken,
} from "api/auth";

type ContextProps = {
  children: React.ReactNode;
};

const getTokenExp = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
};

export const AuthContextProvider = ({ children }: ContextProps) => {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    const storedRefresh = localStorage.getItem("refresh");
    localStorage.removeItem("refresh");
    setAccess(null);
    setRefresh(null);
    queryClient.removeQueries({ queryKey: ["me"] });
    if (storedRefresh) {
      blacklistToken(storedRefresh).catch(() => {});
    }
    navigate("/auth/login");
  }, [navigate, queryClient]);

  const { mutate: refreshAccess } = useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      setAccess(data.access);
      if ((data as LoginResponse).refresh) {
        localStorage.setItem("refresh", (data as LoginResponse).refresh);
        setRefresh((data as LoginResponse).refresh);
      }
    },
    onError: (error: Error) => {
      showToast({
        message: `${error.message}, please log in again.`,
        type: "danger",
      });
      logout();
    },
  });

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

  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["me", access],
    queryFn: () => getUser(access!),
    enabled: !!access,
    staleTime: 60_000,
  });

  useEffect(() => {
    const storedRefresh = localStorage.getItem("refresh");
    if (!storedRefresh) {
      setIsInitializing(false);
      return;
    }
    setRefresh(storedRefresh);
    refreshToken(storedRefresh)
      .then((data) => {
        setAccess(data.access);
        if ((data as LoginResponse).refresh) {
          localStorage.setItem("refresh", (data as LoginResponse).refresh);
          setRefresh((data as LoginResponse).refresh);
        }
      })
      .catch(() => {
        localStorage.removeItem("refresh");
        setRefresh(null);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (!access || !refresh) return;
    const exp = getTokenExp(access);
    const delay = exp - Date.now() - 30_000;
    if (delay <= 0) {
      refreshAccess(refresh);
      return;
    }
    const timeout = setTimeout(() => {
      refreshAccess(refresh);
    }, delay);
    return () => clearTimeout(timeout);
  }, [access, refresh, refreshAccess]);

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
        currentUser: currentUser ?? null,
        isLoadingUser,
        register,
        isPendingRegister,
        isErrorRegister,
        errorRegister,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
