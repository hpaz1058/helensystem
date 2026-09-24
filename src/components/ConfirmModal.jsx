import React from 'react';

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  icon = 'bi-question-circle',
  onConfirm,
  onCancel
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={onCancel}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={e => e.stopPropagation()}>
        <button className="confirm-close" aria-label="Close" onClick={onCancel}><i className="bi bi-x-lg"/></button>
        <div className={`confirm-icon ${danger ? 'danger' : ''}`}><i className={`bi ${icon}`}/></div>
        <h3 id="confirm-title" className="serif mb-2">{title}</h3>
        <p className="text-secondary mb-4">{message}</p>
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-dark rounded-pill px-4" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${danger ? 'btn-danger-soft' : 'btn-darksoft'} px-4`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
