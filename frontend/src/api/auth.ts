import axios from "axios";
import { API_BASE_URL } from "config";
import type { LoginData, RegisterData } from "context/auth/AuthContext";
import type { LoginResponse, User, RefreshResponse } from "models";

export const extractApiError = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred";
  }
  const data = error.response?.data;
  if (!data) return error.message || "Request failed";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors))
    return data.non_field_errors.join(" ");
  const fieldErrors = Object.entries(data)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
    .join("; ");
  return fieldErrors || "Request failed";
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/jwt/create/`,
      data,
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};

export const registerUser = async (data: RegisterData): Promise<User> => {
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

export const refreshToken = async (
  refresh: string,
): Promise<RefreshResponse> => {
  try {
    const response = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/auth/jwt/refresh/`,
      { refresh },
    );
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};

export const blacklistToken = async (refresh: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/jwt/blacklist/`, { refresh });
};

export const getUser = async (accessToken: string): Promise<User> => {
  try {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/users/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};
