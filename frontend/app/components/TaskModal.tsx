"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, TaskStatus } from "@/types";

interface Props {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    body?: string;
    status?: TaskStatus;
  }) => Promise<void>;
}

const STATUSES: TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export function TaskModal({ open, task, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setBody(task?.body ?? "");
      setStatus(task?.status ?? "PENDING");
      setError("");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, task]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        body: body.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">{task ? "Edit Task" : "New Task"}</h2>
          <button className="modal__close" onClick={onClose} aria-label="close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title *
            </label>
            <input
              id="task-title"
              ref={titleRef}
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-body">
              Description
            </label>
            <textarea
              id="task-body"
              className="form-input form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add details (optional)"
              rows={3}
            />
          </div>

          {task && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="status-picker">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`status-option status-option--${s.toLowerCase()} ${status === s ? "status-option--active" : ""}`}
                    onClick={() => setStatus(s)}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}>
              {saving ? "Saving…" : task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
