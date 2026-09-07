import api from "../api/axios";
import type { LoginDto, AuthResponse } from "../types/auth";

export async function login(
  data: LoginDto,
) {

  const response =
    await api.post<AuthResponse>(
      "/auth/login",
      data,
    );

  return response.data;
}