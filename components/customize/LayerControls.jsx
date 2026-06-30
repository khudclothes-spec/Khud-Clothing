"use client";

// Layer + element actions for the currently selected object.
// `selection` is null when nothing is selected (controls render disabled).
export function LayerControls({ selection, onForward, onBackward, onDelete }) {
  const disabled = !selection;
  return (
    <div className="studio-layers">
      <div className="studio-btn-grid">
        <button type="button" className="studio-action" onClick={onForward} disabled={disabled}>
          <LayerUpIcon />
          Bring forward
        </button>
        <button type="button" className="studio-action" onClick={onBackward} disabled={disabled}>
          <LayerDownIcon />
          Send backward
        </button>
      </div>
      <button
        type="button"
        className="studio-action studio-action--danger"
        onClick={onDelete}
        disabled={disabled}
      >
        <TrashIcon />
        Delete element
      </button>
      {disabled && (
        <p className="studio-hint-muted">Select an element on the canvas to edit it.</p>
      )}
    </div>
  );
}

function LayerUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M3 9l3-3 3 3M6 6v9" />
    </svg>
  );
}

function LayerDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M21 15l-3 3-3-3M18 18V9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}
