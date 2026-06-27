"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/CartContext";
import { Info, Upload } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import {
  COLORS,
  customColors,
  customPlacements,
  customProducts,
  customSizes,
  formatPrice
} from "@/lib/data";

const markPositions = {
  Front: { top: "38%", left: "50%", transform: "translate(-50%, -50%)" },
  Back: { top: "38%", left: "50%", transform: "translate(-50%, -50%)" },
  Sleeve: { top: "34%", left: "26%", transform: "translate(-50%, -50%)" },
  Chest: { top: "34%", left: "40%", transform: "translate(-50%, -50%)" }
};

const markSizes = {
  Front: 60,
  Back: 60,
  Sleeve: 30,
  Chest: 32
};

export function CustomizeBuilder() {
  const [selection, setSelection] = useState({
    product: customProducts[0].name,
    size: "M",
    color: "Black",
    placement: "Front"
  });
  const { addItem } = useCart();

  const activeProduct = useMemo(
    () => customProducts.find((product) => product.name === selection.product) || customProducts[0],
    [selection.product]
  );
  const activeColor = customColors.find((color) => color.name === selection.color) || customColors[0];
  const markLogo = selection.color === "Black" ? "/images/logo-white-writing.png" : "/images/logo-black-writing.png";

  function updateSelection(patch) {
    setSelection((current) => ({ ...current, ...patch }));
  }

  function requestProof() {
    addItem({
      key: `Custom ${selection.product}/${selection.size}/${selection.color}/${selection.placement}`,
      name: `Custom ${selection.product}`,
      meta: `${selection.size} - ${selection.color} - ${selection.placement}`,
      price: activeProduct.price,
      shape: activeProduct.shape
    });
  }

  return (
    <section className="container builder-layout">
      <div className="builder-controls">
        <div>
          <StepTitle number="01" title="Choose your garment" />
          <div className="garment-grid">
            {customProducts.map((product) => {
              const selected = product.name === selection.product;
              return (
                <button
                  key={product.name}
                  type="button"
                  className={`choice-card ${selected ? "is-selected" : ""}`}
                  onClick={() => updateSelection({ product: product.name })}
                >
                  <TeeGraphic
                    className="choice-card__svg"
                    path={product.shape}
                    fill={selected ? COLORS.clay : COLORS.charcoal}
                    width={44}
                    opacity={0.85}
                  />
                  <div className="choice-card__name">{product.name}</div>
                  <div className="choice-card__price">from {formatPrice(product.price)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <StepTitle number="02" title="Upload your artwork" />
          <label className="upload-zone">
            <Upload />
            <div className="upload-zone__title">Drag and drop your artwork here</div>
            <div className="upload-zone__copy">PNG, JPG, SVG or PDF - up to 25MB - High-res for best print</div>
            <span className="upload-zone__button">Browse Files</span>
            <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" style={{ display: "none" }} />
          </label>
          <div className="info-strip">
            <Info />
            <span>Need design help? Let our team know in the print notes below.</span>
          </div>
        </div>

        <div>
          <StepTitle number="03" title="Print notes" />
          <textarea className="print-notes" placeholder="Example: Thank God its friday" />
          <div className="field-note">
            Tell us placement, size, color, or special instructions. We will send a proof before printing.
          </div>
        </div>

        <div className="split-controls">
          <div>
            <StepTitle number="04" title="Placement" />
            <div className="placement-grid">
              {customPlacements.map((placement) => (
                <button
                  key={placement}
                  type="button"
                  className={`choice-button ${selection.placement === placement ? "is-selected" : ""}`}
                  onClick={() => updateSelection({ placement })}
                >
                  {placement}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 28 }}>
              <StepTitle number="05" title="Size" />
              <div className="size-row">
                {customSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`choice-button ${selection.size === size ? "is-selected" : ""}`}
                    onClick={() => updateSelection({ size })}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <StepTitle number="06" title="Garment color" />
            <div className="color-row">
              {customColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`color-button ${selection.color === color.name ? "is-selected" : ""}`}
                  style={{ background: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                  onClick={() => updateSelection({ color: color.name })}
                />
              ))}
            </div>
            <div className="selected-copy">
              Selected: <strong>{selection.color}</strong>
            </div>
          </div>
        </div>
      </div>

      <aside className="preview">
        <div className="preview-card">
          <div className="preview-art">
            <TeeGraphic path={activeProduct.shape} fill={activeColor.hex} width="50%" />
            <div className="preview-mark" style={markPositions[selection.placement]}>
              <img
                src={markLogo}
                alt=""
                style={{ width: markSizes[selection.placement] || 60 }}
              />
            </div>
            <span className="preview-label">Live Preview</span>
            <span className="preview-placement">{selection.placement}</span>
          </div>
          <div className="preview-body">
            <div className="preview-title">Your {selection.product}</div>
            <div className="preview-lines">
              <div className="preview-line">
                <span>Size</span>
                <strong>{selection.size}</strong>
              </div>
              <div className="preview-line">
                <span>Color</span>
                <strong>{selection.color}</strong>
              </div>
              <div className="preview-line">
                <span>Placement</span>
                <strong>{selection.placement}</strong>
              </div>
              <div className="preview-line preview-line--price">
                <span>Est. from</span>
                <strong>{formatPrice(activeProduct.price)}</strong>
              </div>
            </div>
            <button type="button" className="button button--dark" style={{ width: "100%", marginTop: 22 }} onClick={requestProof}>
              Request Custom Proof
            </button>
            <div className="preview-note">
              <Info size={15} />
              <span>No payment now. We send a final proof for approval before printing.</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function StepTitle({ number, title }) {
  return (
    <div className="builder-step-title">
      <span>{number}</span>
      <span>{title}</span>
    </div>
  );
}
