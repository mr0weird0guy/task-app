import type { PaginatedTasks, Task, TaskFilters, TaskStatus } from "@/types";
import { apiFetch } from ".";

export const tasksApi = {
  list: (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    return apiFetch<PaginatedTasks>(`/tasks${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => apiFetch<Task>(`/tasks/${id}`),

  create: (data: { title: string; body?: string; status?: TaskStatus }) =>
    apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { title?: string; body?: string | null; status?: TaskStatus },
  ) =>
    apiFetch<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),

  toggle: (id: string) =>
    apiFetch<Task>(`/tasks/${id}/toggle`, { method: "POST" }),
};
