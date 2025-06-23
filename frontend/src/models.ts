export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ToastMessageData {
  id: number;
  message: string;
  type: "success" | "danger" | "secondary" | "warning";
  title?: string;
  duration?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}
