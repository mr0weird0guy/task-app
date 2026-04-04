import type { AuthResponse } from "@/types";
import { apiFetch, tokenStore } from ".";

export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<void>("/auth/logout", { method: "POST" }).finally(() =>
      tokenStore.clear(),
    ),
};
