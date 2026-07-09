"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { createClient } from "@/lib/supabase";
import { Info, Upload, ArrowRight, Close } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import { StudioCanvas } from "@/components/customize/StudioCanvas";
import { ViewSelector } from "@/components/customize/ViewSelector";
import { TextControls } from "@/components/customize/TextControls";
import { LayerControls } from "@/components/customize/LayerControls";
import { ChooseDesign } from "@/components/customize/ChooseDesign";
import { ApprovalModal } from "@/components/customize/ApprovalModal";
import { LeaveGuardModal } from "@/components/customize/LeaveGuardModal";
import {
  COLORS,
  TEE_PATH,
  studioColors,
  customSizes,
  customViews,
  customSleeveViews,
  customFallbackGarments,
  inferMockupKey,
  studioGarmentPrice,
  studioMockupSrc,
  customAcceptedImageTypes,
  customMaxImageBytes,
  formatPrice
} from "@/lib/data";

export function CustomStudio() {
  const router = useRouter();
  const { addItem } = useCart();

  const [garments, setGarments] = useState(customFallbackGarments);
  const [product, setProduct] = useState(customFallbackGarments[0]);
  const [color, setColor] = useState(studioColors[0]);
  const [size, setSize] = useState("M");
  const [sleeve, setSleeve] = useState("none");
  const [view, setView] = useState("Front");
  const [selection, setSelection] = useState(null);
  const [counts, setCounts] = useState({});
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [approval, setApproval] = useState({ open: false, previews: [] });
  const [leave, setLeave] = useState({ open: false, href: null });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dirtyRef = useRef(false);
  const bypassRef = useRef(false);

  const isSleeve = customSleeveViews.includes(view);

  // Sleeve upgrade options (Phase 3) — only those the admin enabled show up.
  const sleeveOptions = [];
  if (product.halfSleeve?.enabled) sleeveOptions.push({ key: "half", label: "Half sleeve", price: product.halfSleeve.price });
  if (product.fullSleeve?.enabled) sleeveOptions.push({ key: "full", label: "Full sleeve", price: product.fullSleeve.price });
  const selectedSleeve = sleeveOptions.find((o) => o.key === sleeve) || null;
  const effectivePrice = (product.price || 0) + (selectedSleeve?.price || 0);

  // Reset the sleeve choice to the first enabled option whenever the garment changes.
  useEffect(() => {
    const opts = [];
    if (product.halfSleeve?.enabled) opts.push("half");
    if (product.fullSleeve?.enabled) opts.push("full");
    setSleeve(opts[0] ?? "none");
  }, [product.id]);

  // ---- load customizable garments (categories enabled by the admin) ---------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, is_customizable, mockup_key, custom_base_price, custom_half_sleeve_enabled, custom_half_sleeve_price, custom_full_sleeve_enabled, custom_full_sleeve_price")
          .eq("is_customizable", true)
          .order("name");
        if (error) throw error;
        const mapped = (data ?? []).map((c) => {
          const key = c.mockup_key || inferMockupKey(c);
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            mockupKey: key,
            // Admin base price wins; else the static per-mockup price.
            price: c.custom_base_price != null ? Number(c.custom_base_price) : (studioGarmentPrice[key] ?? 4000),
            halfSleeve: { enabled: !!c.custom_half_sleeve_enabled, price: Number(c.custom_half_sleeve_price) || 0 },
            fullSleeve: { enabled: !!c.custom_full_sleeve_enabled, price: Number(c.custom_full_sleeve_price) || 0 },
            shape: TEE_PATH
          };
        });
        if (active && mapped.length) {
          setGarments(mapped);
          setProduct(mapped[0]);
        }
      } catch {
        // Column/table missing or DB unavailable — keep the static fallback.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ---- warm the mockup cache so switching view/colour is instant ------------
  useEffect(() => {
    if (!product.mockupKey || typeof window === "undefined") return;
    customViews.forEach((v) => {
      const src = studioMockupSrc(product.mockupKey, color.key, v.id);
      if (src) {
        const img = new window.Image();
        img.decoding = "async";
        img.src = src;
      }
    });
  }, [product.mockupKey, color.key]);

  // ---- canvas callbacks ------------------------------------------------------
  const refreshCounts = useCallback(() => {
    const s = canvasRef.current?.getSummary?.();
    if (s) setCounts(s.counts);
  }, []);

  const handleDirty = useCallback(
    (dirty) => {
      dirtyRef.current = dirty;
      refreshCounts();
    },
    [refreshCounts]
  );

  // ---- toast -----------------------------------------------------------------
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- navigation guard: full page unload (reload / close / external) --------
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ---- navigation guard: in-app link clicks ----------------------------------
  useEffect(() => {
    function onClick(e) {
      if (!dirtyRef.current || bypassRef.current) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = e.target.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      const target = a.getAttribute("target");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        /^https?:\/\//.test(href) ||
        target === "_blank" ||
        href === "/customize"
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      setLeave({ open: true, href });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  function confirmLeave() {
    const href = leave.href;
    dirtyRef.current = false;
    bypassRef.current = true;
    setLeave({ open: false, href: null });
    if (href) router.push(href);
  }

  // ---- element actions -------------------------------------------------------
  function addText() {
    canvasRef.current?.addText("Your text");
  }

  function addDesign(url) {
    canvasRef.current?.addImage(url);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!customAcceptedImageTypes.includes(file.type)) {
      setToast({ type: "error", message: "Unsupported file. Upload a PNG, JPG, or SVG image." });
      return;
    }
    if (file.size > customMaxImageBytes) {
      setToast({ type: "error", message: "That image is over 8 MB. Please upload a smaller file." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => canvasRef.current?.addImage(reader.result);
    reader.onerror = () => setToast({ type: "error", message: "Could not read that file. Try another." });
    reader.readAsDataURL(file);
  }

  function updateProp(name, value) {
    setSelection((s) => (s ? { ...s, [name]: value } : s));
    canvasRef.current?.setProp(name, value);
  }

  // ---- approval flow ---------------------------------------------------------
  async function handlePreview() {
    const canvas = canvasRef.current;
    if (!canvas?.hasAnyObjects()) {
      setToast({ type: "error", message: "Add at least one text or image before previewing." });
      return;
    }
    const bounds = canvas.validateBounds();
    if (!bounds.ok) {
      setToast({ type: "error", message: bounds.message });
      return;
    }
    const previews = await canvas.exportViews();
    setApproval({ open: true, previews });
  }

  async function confirmAdd() {
    const canvas = canvasRef.current;
    const thumb = await canvas.exportThumbnail();
    const summary = canvas.getSummary();
    const areas = Object.keys(summary.counts).join(", ") || view;
    addItem({
      key: `custom-${Date.now()}`,
      name: `Custom ${product.name}`,
      meta: `${color.name} · ${size}${selectedSleeve ? ` · ${selectedSleeve.label}` : ""} · ${areas}`,
      price: effectivePrice,
      image: thumb,
      shape: product.shape,
      custom: true
    });
    dirtyRef.current = false;
    setApproval({ open: false, previews: [] });
    setToast({ type: "success", message: "Custom piece added to your bag." });
  }

  return (
    <div className="studio">
      <div className="studio-tip">
        <Info size={15} />
        <span>
          Click <strong>Add text</strong>, <strong>Upload image</strong>, or a design to place it on
          the shirt — then drag it into position inside the dashed area.
        </span>
      </div>

      {/* Garment / colour / size bar */}
      <div className="studio-bar">
        <div className="studio-bar__group">
          <span className="studio-bar__label">Garment</span>
          <div className="studio-garments">
            {garments.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`choice-card studio-garment-card ${p.id === product.id ? "is-selected" : ""}`}
                onClick={() => setProduct(p)}
              >
                <TeeGraphic
                  className="choice-card__svg"
                  path={p.shape}
                  fill={p.id === product.id ? "#1E3A8A" : COLORS.charcoal}
                  width={34}
                  opacity={0.85}
                />
                <span className="choice-card__name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="studio-bar__group">
          <span className="studio-bar__label">Colour</span>
          <div className="color-row">
            {studioColors.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`color-button ${c.key === color.key ? "is-selected" : ""}`}
                style={{ background: c.hex }}
                title={c.name}
                aria-label={c.name}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <span className="studio-bar__selected">{color.name}</span>
        </div>

        <div className="studio-bar__group">
          <span className="studio-bar__label">Size</span>
          <div className="size-row">
            {customSizes.map((s) => (
              <button
                key={s}
                type="button"
                className={`choice-button ${s === size ? "is-selected" : ""}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {sleeveOptions.length > 0 && (
          <div className="studio-bar__group">
            <span className="studio-bar__label">Sleeve</span>
            <div className="size-row">
              {sleeveOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className={`choice-button ${o.key === sleeve ? "is-selected" : ""}`}
                  onClick={() => setSleeve(o.key)}
                >
                  {o.label}{o.price > 0 ? ` +${formatPrice(o.price)}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="studio-grid">
        {/* LEFT: tools */}
        <aside className="studio-panel studio-panel--left">
          <section className="studio-section">
            <h3 className="studio-section__title">Add elements</h3>
            <div className="studio-add-row">
              <button type="button" className="studio-add" onClick={addText} disabled={!ready}>
                <TextIcon />
                Add text
              </button>
              <button
                type="button"
                className="studio-add"
                onClick={() => fileInputRef.current?.click()}
                disabled={!ready}
              >
                <Upload size={18} />
                Upload image
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              onChange={handleFile}
              style={{ display: "none" }}
            />
            <div className="studio-note">
              <Info size={14} />
              <span>PNG, JPG or SVG · up to 8 MB. Elements stay locked inside the printable area.</span>
            </div>
          </section>

          <section className="studio-section">
            <h3 className="studio-section__title">Choose design</h3>
            <ChooseDesign onPick={addDesign} disabled={!ready} />
          </section>

          {selection?.kind === "text" && (
            <section className="studio-section">
              <h3 className="studio-section__title">Text</h3>
              <TextControls value={selection} onChange={updateProp} />
            </section>
          )}

          {selection?.kind === "image" && (
            <section className="studio-section">
              <h3 className="studio-section__title">Image</h3>
              <p className="studio-hint-muted">
                Drag to move, use the handles to resize or rotate. Use the layer controls below to
                stack it.
              </p>
            </section>
          )}

          <section className="studio-section">
            <h3 className="studio-section__title">Layers</h3>
            <LayerControls
              selection={selection}
              onForward={() => canvasRef.current?.bringForward()}
              onBackward={() => canvasRef.current?.sendBackward()}
              onDelete={() => canvasRef.current?.deleteActive()}
            />
          </section>
        </aside>

        {/* CENTER: canvas */}
        <div className="studio-panel studio-panel--center">
          <StudioCanvas
            ref={canvasRef}
            view={view}
            color={color.hex}
            colorKey={color.key}
            mockupKey={product.mockupKey}
            shape={product.shape}
            onReady={() => setReady(true)}
            onSelectionChange={setSelection}
            onDirtyChange={handleDirty}
          />
          {isSleeve && (
            <p className="studio-sleeve-note">
              This is the <strong>whole sleeve cloth</strong>. The dashed centre line marks the
              sleeve fold (outer edge) and is not printed.
            </p>
          )}
        </div>

        {/* RIGHT: printable area selector */}
        <aside className="studio-panel studio-panel--right">
          <section className="studio-section">
            <h3 className="studio-section__title">Printable area</h3>
            <ViewSelector
              activeView={view}
              onSelect={setView}
              colorHex={color.hex}
              colorKey={color.key}
              mockupKey={product.mockupKey}
              shape={product.shape}
              counts={counts}
            />
            <button
              type="button"
              className="studio-action studio-action--danger studio-clear"
              onClick={() => canvasRef.current?.clearView()}
              disabled={!counts[view]}
            >
              Clear {view}
            </button>
          </section>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="studio-actionbar">
        <div className="studio-actionbar__info">
          <span className="studio-actionbar__product">Custom {product.name}</span>
          <span className="studio-actionbar__price">{formatPrice(effectivePrice)}</span>
        </div>
        <button type="button" className="button button--dark studio-preview-btn" onClick={handlePreview} disabled={!ready}>
          Preview final design
          <ArrowRight />
        </button>
      </div>

      {toast && (
        <div className={`studio-toast studio-toast--${toast.type}`} role="status">
          <span>{toast.message}</span>
          <button type="button" className="plain-icon" onClick={() => setToast(null)} aria-label="Dismiss">
            <Close size={13} />
          </button>
        </div>
      )}

      <ApprovalModal
        open={approval.open}
        previews={approval.previews}
        summary={{
          productName: product.name,
          colorName: color.name,
          colorHex: color.hex,
          colorKey: color.key,
          mockupKey: product.mockupKey,
          size,
          sleeve: selectedSleeve?.label ?? null,
          price: effectivePrice,
          shape: product.shape
        }}
        onConfirm={confirmAdd}
        onBack={() => setApproval({ open: false, previews: [] })}
      />

      <LeaveGuardModal
        open={leave.open}
        onStay={() => setLeave({ open: false, href: null })}
        onLeave={confirmLeave}
      />
    </div>
  );
}

function TextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 6h14M5 6V4h14v2M12 6v14M9 20h6" />
    </svg>
  );
}
