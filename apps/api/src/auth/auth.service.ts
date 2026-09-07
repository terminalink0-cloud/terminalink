// apps/web/src/auth/auth.service.ts

import type { AuthUser, AuthRole, LoginDto, AuthResponse } from "../types/auth";

// Example service functions; adjust according to your actual implementation
export async function loginWithCredentials(dto: LoginDto): Promise<AuthResponse> {
  // implement login logic here (or re-export from another module)
  throw new Error("Not implemented");
}

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