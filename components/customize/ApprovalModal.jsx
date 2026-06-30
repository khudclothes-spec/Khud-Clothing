"use client";

import { useEffect, useState } from "react";
import { Check, Close } from "@/components/Icons";
import { GarmentArt } from "@/components/customize/GarmentArt";
import { formatPrice } from "@/lib/data";

// Approval flow step 2 + 3: a clean, controls-free preview of every printable
// surface the shopper designed, an explicit confirmation checkbox, and the
// gate to add-to-cart. Rejecting ("Back to editor") simply closes — the canvas
// state is untouched, so their work is preserved.
export function ApprovalModal({ open, previews, summary, onConfirm, onBack }) {
  const [checked, setChecked] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Reset the confirmation each time the modal opens.
  useEffect(() => {
    if (open) {
      setChecked(false);
      setAttempted(false);
    }
  }, [open]);

  if (!open) return null;

  function handleAdd() {
    if (!checked) {
      setAttempted(true);
      return;
    }
    onConfirm();
  }

  return (
    <div className="studio-modal-layer" role="dialog" aria-modal="true" aria-label="Confirm your design">
      <button type="button" className="overlay" onClick={onBack} aria-label="Back to editor" />
      <div className="studio-modal">
        <div className="studio-modal__head">
          <div>
            <div className="eyebrow eyebrow--brass">Final proof</div>
            <h2 className="studio-modal__title">Review your design</h2>
          </div>
          <button type="button" className="icon-button" onClick={onBack} aria-label="Close">
            <Close />
          </button>
        </div>

        <div className="studio-modal__body">
          <div className="studio-proof-grid">
            {previews.map((p) => (
              <figure key={p.view} className="studio-proof">
                <div className="studio-proof__art">
                  <GarmentArt
                    view={p.view}
                    colorHex={summary.colorHex}
                    colorKey={summary.colorKey}
                    mockupKey={summary.mockupKey}
                    shape={summary.shape}
                  />
                  <img src={p.dataUrl} alt={`${p.view} design`} className="studio-proof__overlay" />
                </div>
                <figcaption className="studio-proof__cap">{p.view}</figcaption>
              </figure>
            ))}
          </div>

          <div className="studio-modal__summary">
            <div className="studio-summary-line">
              <span>Garment</span>
              <strong>{summary.productName}</strong>
            </div>
            <div className="studio-summary-line">
              <span>Colour</span>
              <strong>{summary.colorName}</strong>
            </div>
            <div className="studio-summary-line">
              <span>Size</span>
              <strong>{summary.size}</strong>
            </div>
            <div className="studio-summary-line">
              <span>Printed areas</span>
              <strong>{previews.map((p) => p.view).join(", ")}</strong>
            </div>
            <div className="studio-summary-line studio-summary-line--price">
              <span>Estimated price</span>
              <strong>{formatPrice(summary.price)}</strong>
            </div>
          </div>
        </div>

        <label className={`studio-confirm ${attempted && !checked ? "is-error" : ""}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              if (e.target.checked) setAttempted(false);
            }}
          />
          <span className="studio-confirm__box" aria-hidden="true">
            {checked && <Check size={14} />}
          </span>
          <span className="studio-confirm__text">
            I confirm this design is correct and ready for printing.
          </span>
        </label>
        {attempted && !checked && (
          <p className="studio-modal__error">Please tick the box to confirm before adding to bag.</p>
        )}

        <div className="studio-modal__actions">
          <button type="button" className="button button--ghost" onClick={onBack}>
            Back to editor
          </button>
          <button
            type="button"
            className="button button--dark"
            onClick={handleAdd}
            aria-disabled={!checked}
            data-locked={!checked}
          >
            Add custom piece to bag
          </button>
        </div>
      </div>
    </div>
  );
}
