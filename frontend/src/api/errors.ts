import axios from "axios";

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
    .filter(([, value]) => Array.isArray(value))
    .map(([field, value]) => `${field}: ${(value as string[]).join(", ")}`)
    .join("; ");
  return fieldErrors || "Request failed";
};
