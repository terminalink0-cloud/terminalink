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