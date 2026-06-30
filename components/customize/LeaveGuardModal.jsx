"use client";

// Shown when a shopper with an in-progress design tries to navigate away.
// "Discard & leave" continues to the requested page; "Keep editing" stays.
export function LeaveGuardModal({ open, onStay, onLeave }) {
  if (!open) return null;
  return (
    <div className="studio-modal-layer" role="dialog" aria-modal="true" aria-label="Leave the studio?">
      <button type="button" className="overlay" onClick={onStay} aria-label="Keep editing" />
      <div className="studio-modal studio-modal--compact">
        <h2 className="studio-modal__title">Leave the studio?</h2>
        <p className="studio-modal__copy">
          Your current design hasn't been added to your bag. If you leave now it will be lost — this
          can't be undone.
        </p>
        <div className="studio-modal__actions">
          <button type="button" className="button button--ghost" onClick={onStay}>
            Keep editing
          </button>
          <button type="button" className="button button--dark" onClick={onLeave}>
            Discard &amp; leave
          </button>
        </div>
      </div>
    </div>
  );
}
