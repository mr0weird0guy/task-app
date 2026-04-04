"use client";

import { useToast } from "@/hooks/useToast";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          role="alert"
          onClick={() => dismiss(t.id)}>
          <span className="toast__icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "i"}
          </span>
          <span className="toast__msg">{t.message}</span>
          <button className="toast__close" aria-label="dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
