import { http } from "./http";
import { AuthResponse, User } from "../types/auth";

export async function register(
  email: string,
  name: string,
  password: string
): Promise<AuthResponse> {
  return http<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password })
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return http<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  return http<User>("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
