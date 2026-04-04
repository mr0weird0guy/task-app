"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tasksApi, ApiError } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { TaskCard } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Task, TaskFilters, TaskStatus, PaginatedTasks } from "@/types";

const LIMIT = 12;

//  Skeleton loader
function SkeletonGrid() {
  return (
    <div className="loading-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton">
          <div className="skeleton__line skeleton__line--sm" />
          <div className="skeleton__line skeleton__line--md" />
          <div className="skeleton__line skeleton__line--lg" />
          <div
            className="skeleton__line skeleton__line--sm"
            style={{ width: "40%" }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  //  State
  const [result, setResult] = useState<PaginatedTasks | null>(null);
  const [fetching, setFetching] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: LIMIT,
  });
  const [searchInput, setSearchInput] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  //  Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  //  Fetch tasks
  const fetchTasks = useCallback(
    async (f: TaskFilters) => {
      setFetching(true);
      try {
        const data = await tasksApi.list(f);
        setResult(data);
      } catch (err) {
        if (err instanceof ApiError && err.status !== 401) {
          toast("Failed to load tasks", "error");
        }
      } finally {
        setFetching(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!authLoading && user) fetchTasks(filters);
  }, [filters, authLoading, user, fetchTasks]);

  //  Search debounce
  function handleSearch(value: string) {
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value || undefined, page: 1 }));
    }, 350);
  }

  function handleStatusFilter(value: string) {
    setFilters((f) => ({
      ...f,
      status: value as TaskStatus | "",
      page: 1,
    }));
  }

  function goToPage(page: number) {
    setFilters((f) => ({ ...f, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  //  CRUD handlers
  async function handleSave(data: {
    title: string;
    body?: string;
    status?: TaskStatus;
  }) {
    if (editingTask) {
      const updated = await tasksApi.update(editingTask.id, data);
      setResult((r) =>
        r
          ? {
              ...r,
              data: r.data.map((t) => (t.id === updated.id ? updated : t)),
            }
          : r,
      );
      toast("Task updated");
    } else {
      await tasksApi.create(data);
      toast("Task created");
      // Refresh first page to show new task
      fetchTasks({ ...filters, page: 1 });
      setFilters((f) => ({ ...f, page: 1 }));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await tasksApi.delete(deleteId);
      setResult((r) =>
        r
          ? {
              ...r,
              data: r.data.filter((t) => t.id !== deleteId),
              meta: { ...r.meta, total: r.meta.total - 1 },
            }
          : r,
      );
      toast("Task deleted");
    } catch {
      toast("Failed to delete task", "error");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleToggle(id: string) {
    try {
      const updated = await tasksApi.toggle(id);
      setResult((r) =>
        r
          ? {
              ...r,
              data: r.data.map((t) => (t.id === updated.id ? updated : t)),
            }
          : r,
      );
      toast(`Status → ${updated.status.replace("_", " ")}`);
    } catch {
      toast("Failed to update status", "error");
    }
  }

  //  Derived counts
  const tasks = result?.data ?? [];
  const meta = result?.meta;

  const counts = tasks.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  //  Loading state
  if (authLoading) return null;

  return (
    <div className="shell">
      {/*  Topbar */}
      <header className="topbar">
        <div className="topbar__logo">
          <div className="topbar__mark">T</div>
          TaskFlow
        </div>
        <div className="topbar__right">
          <span className="topbar__email">{user?.email}</span>
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {/*  Main */}
      <main className="dashboard">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              My <span>Tasks</span>
            </h1>
            {meta && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  marginTop: 4,
                }}>
                {meta.total} task{meta.total !== 1 ? "s" : ""} total
              </p>
            )}
          </div>
          <button
            className="btn btn--primary"
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}>
            + New Task
          </button>
        </div>

        {/* Stats strip */}
        {!fetching && tasks.length > 0 && (
          <div className="stats-strip">
            <div className="stat-chip">
              <div className="stat-chip__dot stat-chip__dot--all" />
              All · {meta?.total ?? 0}
            </div>
            {counts.PENDING > 0 && (
              <div className="stat-chip">
                <div className="stat-chip__dot stat-chip__dot--pending" />
                Pending · {counts.PENDING}
              </div>
            )}
            {counts.IN_PROGRESS > 0 && (
              <div className="stat-chip">
                <div className="stat-chip__dot stat-chip__dot--in_progress" />
                In Progress · {counts.IN_PROGRESS}
              </div>
            )}
            {counts.DONE > 0 && (
              <div className="stat-chip">
                <div className="stat-chip__dot stat-chip__dot--done" />
                Done · {counts.DONE}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-wrap__icon">⌕</span>
            <input
              className="form-input"
              type="search"
              placeholder="Search tasks…"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filters.status ?? ""}
            onChange={(e) => handleStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {/* Task grid */}
        {fetching ? (
          <SkeletonGrid />
        ) : tasks.length === 0 ? (
          <div className="task-grid">
            <div className="empty-state">
              <div className="empty-state__icon">📋</div>
              <h2 className="empty-state__title">No tasks found</h2>
              <p className="empty-state__sub">
                {filters.search || filters.status
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
            </div>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setModalOpen(true);
                }}
                onDelete={(id) => setDeleteId(id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <nav className="pagination" aria-label="Pagination">
            <button
              className="page-btn"
              onClick={() => goToPage(meta.page - 1)}
              disabled={meta.page <= 1}
              aria-label="Previous page">
              ‹
            </button>

            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - meta.page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === meta.page ? "page-btn--active" : ""}`}
                  onClick={() => goToPage(p)}
                  aria-current={p === meta.page ? "page" : undefined}>
                  {p}
                </button>
              ))}

            <button
              className="page-btn"
              onClick={() => goToPage(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              aria-label="Next page">
              ›
            </button>

            <span className="pagination__info">
              Page {meta.page} of {meta.totalPages}
            </span>
          </nav>
        )}
      </main>

      {/*  Modals */}
      <TaskModal
        open={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
