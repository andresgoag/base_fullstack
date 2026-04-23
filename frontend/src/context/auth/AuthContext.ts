import type { User } from "models";
import { createContext, useContext } from "react";

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  re_password: string;
};

interface AuthContextObject {
  access: string | null;
  refresh: string | null;
  login: (data: LoginData) => void;
  isPendingLogin: boolean;
  isErrorLogin: boolean;
  errorLogin: Error | null;
  logout: () => void;
  currentUser: User | null;
  isLoadingUser: boolean;
  register: (data: RegisterData) => void;
  isPendingRegister: boolean;
  isErrorRegister: boolean;
  errorRegister: Error | null;
  isInitializing: boolean;
}

export const AuthContext = createContext<AuthContextObject>({
  access: null,
  refresh: null,
  login: () => {},
  isPendingLogin: false,
  isErrorLogin: false,
  errorLogin: null,
  logout: () => {},
  currentUser: null,
  isLoadingUser: false,
  register: () => {},
  isPendingRegister: false,
  isErrorRegister: false,
  errorRegister: null,
  isInitializing: true,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within a AuthProvider");
  return context;
};
