import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AuthContext } from "./AuthContext";
import { useToastContext } from "@/context/toast/ToastContext";
import {
  requestLogin,
  requestRegistration,
  requestTokenBlacklist,
} from "@/api/authEndpoints";
import { fetchCurrentUser } from "@/api/user";
import { refreshSession } from "@/auth/refreshSession";
import { getStoredRefreshToken, setSession } from "@/auth/session";
import { getAccessTokenExpiry } from "@/auth/tokenExpiry";
import { useSession } from "@/auth/useSession";

const USER_QUERY_STALE_TIME_MS = 60_000;
const TOKEN_REFRESH_BUFFER_MS = 30_000;

type ContextProps = {
  children: React.ReactNode;
};

export const AuthContextProvider = ({ children }: ContextProps) => {
  const session = useSession();
  const [isInitializing, setIsInitializing] = useState(true);
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    const refreshToken = getStoredRefreshToken();
    setSession(null);
    queryClient.removeQueries({ queryKey: ["me"] });
    if (refreshToken) {
      requestTokenBlacklist(refreshToken).catch(() => {});
    }
    navigate("/auth/login");
  }, [navigate, queryClient]);

  const login = useMutation({
    mutationFn: requestLogin,
    onSuccess: (tokens) => {
      setSession({ access: tokens.access, refresh: tokens.refresh });
      navigate("/");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  const register = useMutation({
    mutationFn: requestRegistration,
    onSuccess: () => {
      navigate("/auth/login");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "danger" });
    },
  });

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: !!session,
    staleTime: USER_QUERY_STALE_TIME_MS,
  });

  useEffect(() => {
    refreshSession().finally(() => setIsInitializing(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    const expiresAt = getAccessTokenExpiry(session.access);
    if (expiresAt === null) return;

    const delay = Math.max(0, expiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS);
    const timeout = setTimeout(() => {
      refreshSession().then((renewed) => {
        if (renewed) return;
        showToast({
          message: "Your session expired, please log in again.",
          type: "danger",
        });
        navigate("/auth/login");
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [session, showToast, navigate]);

  const value = useMemo(
    () => ({
      session,
      currentUser: currentUser ?? null,
      isLoadingUser,
      isInitializing,
      login,
      register,
      logout,
    }),
    [
      session,
      currentUser,
      isLoadingUser,
      isInitializing,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
