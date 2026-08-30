import { AuthContext } from "./AuthContext";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import type { LoginResponse, RegisterData } from "models";
import { useToastContext } from "context/toast/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { loginUser, blacklistToken } from "api/tokens";
import { registerUser } from "api/users";
import { useCurrentUser } from "queries/users";
import {
  ACCESS_TOKEN_REFRESH_BUFFER_MS,
  endAuthSession,
  ensureFreshAccessToken,
  getAuthSession,
  needsSessionRestore,
  refreshAuthSession,
  startAuthSession,
  subscribeToAuthSession,
  subscribeToSessionChangesInOtherTabs,
} from "auth/authSession";
import { getMillisecondsUntilRefresh } from "auth/jwt";
import { getRedirectTarget, ROUTES } from "routes";

type ContextProps = {
  children: React.ReactNode;
};

type RegistrationOutcome =
  | { status: "signed-in"; tokens: LoginResponse }
  | { status: "activation-required" };

export const AuthContextProvider = ({ children }: ContextProps) => {
  const session = useSyncExternalStore(subscribeToAuthSession, getAuthSession);
  const [isRestoring, setIsRestoring] = useState(needsSessionRestore);
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    const { refresh } = getAuthSession();
    endAuthSession();
    if (refresh) {
      void blacklistToken(refresh).catch(() => undefined);
    }
    void navigate(ROUTES.login);
  }, [navigate]);

  const {
    mutate: login,
    isPending: isPendingLogin,
    isError: isErrorLogin,
    error: errorLogin,
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: (tokens) => {
      queryClient.clear();
      startAuthSession(tokens);
      void navigate(getRedirectTarget(location.state), { replace: true });
    },
  });

  const {
    mutate: register,
    isPending: isPendingRegister,
    isError: isErrorRegister,
    error: errorRegister,
  } = useMutation({
    mutationFn: async (data: RegisterData): Promise<RegistrationOutcome> => {
      await registerUser(data);
      try {
        const tokens = await loginUser({
          email: data.email,
          password: data.password,
        });
        return { status: "signed-in", tokens };
      } catch {
        return { status: "activation-required" };
      }
    },
    onSuccess: (outcome) => {
      if (outcome.status === "signed-in") {
        queryClient.clear();
        startAuthSession(outcome.tokens);
        void navigate(ROUTES.dashboard, { replace: true });
        return;
      }
      showToast({
        message: "Account created. Check your email to activate it.",
        type: "success",
      });
      void navigate(ROUTES.login);
    },
  });

  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser(
    session.access !== null,
  );

  useEffect(() => {
    void ensureFreshAccessToken().finally(() => {
      setIsRestoring(false);
    });
  }, []);

  useEffect(() => subscribeToSessionChangesInOtherTabs(), []);

  useEffect(() => {
    if (session.refresh === null) queryClient.clear();
  }, [session.refresh, queryClient]);

  useEffect(() => {
    if (!session.access || !session.refresh) return;
    const delay = getMillisecondsUntilRefresh(
      session.access,
      ACCESS_TOKEN_REFRESH_BUFFER_MS,
    );
    const timeout = setTimeout(
      () => {
        refreshAuthSession().catch(() => {
          showToast({
            message: "Your session expired, please log in again.",
            type: "danger",
          });
        });
      },
      Math.max(delay, 0),
    );
    return () => {
      clearTimeout(timeout);
    };
  }, [session.access, session.refresh, showToast]);

  useEffect(() => {
    const refreshOnWake = () => {
      if (document.visibilityState !== "visible") return;
      void ensureFreshAccessToken();
    };
    window.addEventListener("visibilitychange", refreshOnWake);
    window.addEventListener("focus", refreshOnWake);
    return () => {
      window.removeEventListener("visibilitychange", refreshOnWake);
      window.removeEventListener("focus", refreshOnWake);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: {
          access: session.access,
          refresh: session.refresh,
          isAuthenticated: session.access !== null,
          isRestoring,
        },
        currentUser: {
          user: currentUser ?? null,
          isLoading: isLoadingUser,
        },
        login: {
          submit: login,
          isPending: isPendingLogin,
          isError: isErrorLogin,
          error: errorLogin,
        },
        register: {
          submit: register,
          isPending: isPendingRegister,
          isError: isErrorRegister,
          error: errorRegister,
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
