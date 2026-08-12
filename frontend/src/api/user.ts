import { apiClient } from "@/api/client";
import { extractApiError } from "@/api/errors";
import type { User } from "@/auth/types";

export const fetchCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>("/auth/users/me/");
    return response.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
};
