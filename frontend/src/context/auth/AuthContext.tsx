import type { User } from "models";
import { createContext, useContext } from "react";

export type LoginData = {
  username: string;
  email: string;
  password: string;
};

export type RegisterData = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
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
  register: (data: RegisterData) => void;
  isPendingRegister: boolean;
  isErrorRegister: boolean;
  errorRegister: Error | null;
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
  register: () => {},
  isPendingRegister: false,
  isErrorRegister: false,
  errorRegister: null,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within a AuthProvider");
  return context;
};
