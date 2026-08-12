import { createContext, useContext } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { LoginData, RegisterData, Session, User } from "@/auth/types";

type AuthContextObject = {
  session: Session | null;
  currentUser: User | null;
  isLoadingUser: boolean;
  isInitializing: boolean;
  login: UseMutationResult<Session, Error, LoginData>;
  register: UseMutationResult<User, Error, RegisterData>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextObject | undefined>(
  undefined,
);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthContextProvider",
    );
  }
  return context;
};
