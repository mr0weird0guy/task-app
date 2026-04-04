"use client";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal--sm" role="alertdialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">Delete task?</h2>
        </div>
        <p className="modal__body-text">This action cannot be undone.</p>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
