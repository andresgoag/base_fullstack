import type { LoginData, RegisterData, User } from "models";
import { createContext, useContext } from "react";

export type AuthAction<Input> = {
  submit: (input: Input) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

export type AuthSessionState = {
  access: string | null;
  refresh: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
};

export type CurrentUserState = {
  user: User | null;
  isLoading: boolean;
};

export type AuthContextValue = {
  session: AuthSessionState;
  currentUser: CurrentUserState;
  login: AuthAction<LoginData>;
  register: AuthAction<RegisterData>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthContextProvider",
    );
  }
  return context;
};
