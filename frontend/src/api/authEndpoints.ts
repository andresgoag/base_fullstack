import axios from "axios";
import { API_BASE_URL } from "@/config";
import { extractApiError } from "@/api/errors";
import type {
  LoginData,
  RegisterData,
  Session,
  TokenPair,
  User,
} from "@/auth/types";

export const requestLogin = async (data: LoginData): Promise<Session> => {
  try {
    const response = await axios.post<Session>(
      `${API_BASE_URL}/auth/jwt/create/`,
      data,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};

export const requestRegistration = async (
  data: RegisterData,
): Promise<User> => {
  try {
    const response = await axios.post<User>(
      `${API_BASE_URL}/auth/users/`,
      data,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};

export const requestTokenRefresh = async (
  refresh: string,
): Promise<TokenPair> => {
  try {
    const response = await axios.post<TokenPair>(
      `${API_BASE_URL}/auth/jwt/refresh/`,
      { refresh },
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};

export const requestTokenBlacklist = async (refresh: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/jwt/blacklist/`, { refresh });
};
