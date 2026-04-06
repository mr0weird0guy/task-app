import type { AuthTokens } from "@/types";
import { authApi } from "./authApi";
import { tasksApi } from "./tasksApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

//  Token storage (client-side only)

const tokenStore = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  getRefresh: () =>
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null,
  set: (tokens: AuthTokens) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", tokens.accessToken);
    localStorage.setItem("refresh_token", tokens.refreshToken);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

//  Core fetch wrapper

let refreshing: Promise<boolean> | null = null;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  const access = tokenStore.getAccess();
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Token expired → refresh once, then retry
  if (res.status === 401 && retry) {
    if (!refreshing) {
      refreshing = refreshAccessToken().finally(() => {
        refreshing = null;
      });
    }
    const refreshed = await refreshing;
    if (refreshed) return apiFetch<T>(path, options, false);
    tokenStore.clear();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {}
    throw new ApiError(
      res.status,
      body.error ?? "Request failed",
      body.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const tokens: AuthTokens = await res.json();
    tokenStore.set(tokens);
    return true;
  } catch {
    return false;
  }
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export { tasksApi, authApi, ApiError, apiFetch, tokenStore };
