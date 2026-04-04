"use client";

import type { Task } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggle }: Props) {
  const date = new Date(task.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className={`task-card task-card--${task.status.toLowerCase()}`}>
      <div className="task-card__header">
        <span className={`task-badge task-badge--${task.status.toLowerCase()}`}>
          {STATUS_LABELS[task.status]}
        </span>
        <time className="task-card__date">{date}</time>
      </div>

      <h3 className="task-card__title">{task.title}</h3>

      {task.body && <p className="task-card__body">{task.body}</p>}

      <div className="task-card__actions">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => onToggle(task.id)}
          title="Cycle status">
          ↻ Next
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => onEdit(task)}
          title="Edit task">
          ✎ Edit
        </button>
        <button
          className="btn btn--danger btn--sm"
          onClick={() => onDelete(task.id)}
          title="Delete task">
          ✕
        </button>
      </div>
    </article>
  );
}
