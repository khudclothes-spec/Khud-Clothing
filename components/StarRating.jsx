"use client";

/**
 * Shared star-rating component.
 * interactive=true → clickable stars for forms
 * interactive=false → display-only
 */
export function StarRating({ value, onChange, interactive = false, size = 22 }) {
  return (
    <div className="star-rating" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? "is-filled" : ""}`}
          style={{ fontSize: size, cursor: interactive ? "pointer" : "default" }}
          onClick={() => interactive && onChange?.(star)}
          disabled={!interactive}
          aria-label={interactive ? `Rate ${star} star${star !== 1 ? "s" : ""}` : undefined}
        >
          ★
        </button>
      ))}
    </div>
  );
}
