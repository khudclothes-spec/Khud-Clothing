"use client";

import { customFonts, customTextColors } from "@/lib/data";

// Text editing controls. Rendered only when the active object is text.
// All edits flow up via `onChange(prop, value)` which the studio forwards to
// the canvas (which re-fits the object inside the printable area as needed).
export function TextControls({ value, onChange }) {
  return (
    <div className="studio-controls">
      <label className="studio-field">
        <span className="studio-field__label">Text</span>
        <textarea
          className="studio-input studio-input--area"
          rows={2}
          value={value.text ?? ""}
          onChange={(e) => onChange("text", e.target.value)}
          placeholder="Type your text"
        />
      </label>

      <label className="studio-field">
        <span className="studio-field__label">Font</span>
        <select
          className="studio-input"
          value={value.fontFamily}
          onChange={(e) => onChange("fontFamily", e.target.value)}
        >
          {customFonts.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <div className="studio-field">
        <span className="studio-field__label">
          Size <strong>{value.fontSize}px</strong>
        </span>
        <input
          type="range"
          className="studio-range"
          min={8}
          max={160}
          step={1}
          value={value.fontSize}
          onChange={(e) => onChange("fontSize", Number(e.target.value))}
        />
      </div>

      <div className="studio-field">
        <span className="studio-field__label">Style</span>
        <div className="studio-btn-row">
          <button
            type="button"
            className={`studio-toggle ${value.fontWeight === "bold" ? "is-on" : ""}`}
            onClick={() => onChange("fontWeight", value.fontWeight === "bold" ? "normal" : "bold")}
            aria-pressed={value.fontWeight === "bold"}
            style={{ fontWeight: 700 }}
          >
            B
          </button>
          <button
            type="button"
            className={`studio-toggle ${value.fontStyle === "italic" ? "is-on" : ""}`}
            onClick={() => onChange("fontStyle", value.fontStyle === "italic" ? "normal" : "italic")}
            aria-pressed={value.fontStyle === "italic"}
            style={{ fontStyle: "italic" }}
          >
            I
          </button>
          <button
            type="button"
            className={`studio-toggle ${value.underline ? "is-on" : ""}`}
            onClick={() => onChange("underline", !value.underline)}
            aria-pressed={!!value.underline}
            style={{ textDecoration: "underline" }}
          >
            U
          </button>
        </div>
      </div>

      <div className="studio-field">
        <span className="studio-field__label">Alignment</span>
        <div className="studio-btn-row">
          {["left", "center", "right"].map((align) => (
            <button
              key={align}
              type="button"
              className={`studio-toggle ${value.textAlign === align ? "is-on" : ""}`}
              onClick={() => onChange("textAlign", align)}
              aria-pressed={value.textAlign === align}
            >
              {align === "left" ? "⇤" : align === "center" ? "≡" : "⇥"}
            </button>
          ))}
        </div>
      </div>

      <div className="studio-field">
        <span className="studio-field__label">Colour</span>
        <div className="studio-swatches">
          {customTextColors.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`studio-swatch ${value.fill === hex ? "is-selected" : ""}`}
              style={{ background: hex }}
              onClick={() => onChange("fill", hex)}
              aria-label={`Colour ${hex}`}
            />
          ))}
          <label className="studio-swatch studio-swatch--custom" title="Custom colour">
            <input
              type="color"
              value={typeof value.fill === "string" && value.fill.startsWith("#") ? value.fill : "#11100E"}
              onChange={(e) => onChange("fill", e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
