export type Session = {
  access: string;
  refresh: string;
};

export type TokenPair = {
  access: string;
  refresh?: string;
};

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

export type User = {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
};
