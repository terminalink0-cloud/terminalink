// apps/web/src/types/auth.ts

export type AuthRole = "ADMIN" | "DISPATCHER" | "DRIVER";

export type AuthUser = {
  id: string;
  username: string;
  role: AuthRole;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
};

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}