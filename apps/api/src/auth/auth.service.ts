// apps/web/src/auth/auth.service.ts

import type { AuthUser, AuthRole } from "../types/auth";

export function getRoleHome(role: AuthRole): string {
  switch (role) {
    case "ADMIN":
      return "/";
    case "DISPATCHER":
      return "/dispatcher";
    case "DRIVER":
      return "/driver";
    default:
      return "/commuter";
  }
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return !!user && !!user.role;
}