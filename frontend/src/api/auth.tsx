import { API_BASE_URL } from "config";
import axios from "axios";
import type { LoginData, RegisterData } from "context/auth/AuthContext";
import type {
  LoginResponse,
  User,
  RegisterResponse,
  RefreshResponse,
} from "models";

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/jwt/create/`,
      data
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || "Login failed");
    } else {
      throw new Error("An unexpected error occurred while logging in");
    }
  }
};

export const registerUser = async (
  data: RegisterData
): Promise<RegisterResponse> => {
  try {
    const response = await axios.post<RegisterResponse>(
      `${API_BASE_URL}/auth/users/`,
      data
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || "Register failed");
    } else {
      throw new Error("An unexpected error occurred while registering");
    }
  }
};

export const refreshToken = async (
  refresh: string
): Promise<RefreshResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/jwt/refresh/`,
      { refresh }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || "Refresh failed");
    } else {
      throw new Error("An unexpected error occurred while refreshing token");
    }
  }
};

export const getUser = async (accessToken: string): Promise<User> => {
  try {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/users/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch user data"
      );
    } else {
      throw new Error("An unexpected error occurred while fetching user data");
    }
  }
};
