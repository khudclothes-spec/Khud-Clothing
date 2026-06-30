"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { customPrintAreas, customViews, customSleeveViews, STUDIO_ACCENT } from "@/lib/data";
import { GarmentArt } from "@/components/customize/GarmentArt";

const VIEW_IDS = customViews.map((v) => v.id);
const EPS = 0.5;

function isTextObj(obj) {
  return obj && typeof obj.text === "string" && obj.fontSize !== undefined;
}

// Decorate an object's selection controls to match the brand palette.
function styleObject(obj) {
  obj.set({
    borderColor: STUDIO_ACCENT,
    cornerColor: STUDIO_ACCENT,
    cornerStrokeColor: "#FBF8F1",
    cornerStyle: "circle",
    cornerSize: 11,
    transparentCorners: false,
    padding: 3,
    borderScaleFactor: 1.4
  });
}

/**
 * StudioCanvas owns the single Fabric.js canvas and every interaction rule:
 * per-view design storage, the hard printable-area boundary, layering and
 * export. The parent talks to it only through the imperative handle.
 */
export const StudioCanvas = forwardRef(function StudioCanvas(
  { view, color, colorKey, mockupKey, shape, onReady, onSelectionChange, onDirtyChange },
  ref
) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);

  const fabricRef = useRef(null); // the Fabric.Canvas instance
  const fabricModRef = useRef(null); // the imported fabric module
  const sizeRef = useRef({ w: 420, h: 488 });
  const regionRef = useRef(null); // current printable region in px
  const designsRef = useRef(Object.fromEntries(VIEW_IDS.map((id) => [id, null])));
  const currentViewRef = useRef(view);
  const loadingRef = useRef(false);
  const exportingRef = useRef(false);

  // Keep the latest props/callbacks reachable from stable handlers.
  const propsRef = useRef({ color, shape, onReady, onSelectionChange, onDirtyChange });
  propsRef.current = { color, shape, onReady, onSelectionChange, onDirtyChange };

  const [canvasSize, setCanvasSize] = useState({ w: 420, h: 488 });
  const [ready, setReady] = useState(false);

  // ---- geometry helpers ------------------------------------------------------
  function computeRegion(viewId) {
    const a = customPrintAreas[viewId] || customPrintAreas.Front;
    const { w, h } = sizeRef.current;
    return { x: a.x * w, y: a.y * h, width: a.width * w, height: a.height * h };
  }

  function snapshot(obj) {
    obj._inBounds = {
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      angle: obj.angle
    };
  }

  function restore(obj) {
    if (!obj._inBounds) return;
    obj.set(obj._inBounds);
    obj.setCoords();
  }

  function within(obj, r) {
    const b = obj.getBoundingRect();
    return (
      b.left >= r.x - EPS &&
      b.top >= r.y - EPS &&
      b.left + b.width <= r.x + r.width + EPS &&
      b.top + b.height <= r.y + r.height + EPS
    );
  }

  // Scale the object down if it is larger than the region, then clamp it fully
  // inside. Used on add and after any text-content change.
  function fitAndClamp(obj) {
    const r = regionRef.current;
    obj.setCoords();
    let b = obj.getBoundingRect();
    if (b.width > r.width || b.height > r.height) {
      const k = Math.min(r.width / b.width, r.height / b.height) * 0.98;
      obj.scaleX *= k;
      obj.scaleY *= k;
      obj.setCoords();
      b = obj.getBoundingRect();
    }
    let nx = obj.left;
    let ny = obj.top;
    if (b.left < r.x) nx += r.x - b.left;
    if (b.top < r.y) ny += r.y - b.top;
    if (b.left + b.width > r.x + r.width) nx += r.x + r.width - (b.left + b.width);
    if (b.top + b.height > r.y + r.height) ny += r.y + r.height - (b.top + b.height);
    obj.set({ left: nx, top: ny });
    obj.setCoords();
    snapshot(obj);
  }

  function addObject(obj) {
    const canvas = fabricRef.current;
    styleObject(obj);
    const r = regionRef.current;
    // initial size: ~70% of the region's shorter side
    obj.setCoords();
    let b = obj.getBoundingRect();
    const target = Math.min(r.width, r.height) * 0.7;
    const longest = Math.max(b.width, b.height);
    if (longest > 0) {
      const k = target / longest;
      if (isTextObj(obj)) {
        // Fit text by its real font size (keep scale at 1) so the size slider
        // always reflects the on-screen size.
        obj.set("fontSize", Math.max(8, Math.round(obj.fontSize * k)));
        obj.scaleX = 1;
        obj.scaleY = 1;
      } else {
        obj.scaleX *= k;
        obj.scaleY *= k;
      }
      obj.setCoords();
      b = obj.getBoundingRect();
    }
    // center in region
    obj.left += r.x + r.width / 2 - (b.left + b.width / 2);
    obj.top += r.y + r.height / 2 - (b.top + b.height / 2);
    obj.setCoords();
    fitAndClamp(obj);
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    flush();
    emitSelection();
  }

  // ---- per-view persistence --------------------------------------------------
  function flush() {
    const canvas = fabricRef.current;
    if (!canvas || loadingRef.current) return;
    designsRef.current[currentViewRef.current] = canvas.toJSON();
    updateDirty();
  }

  function updateDirty() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let total = 0;
    for (const id of VIEW_IDS) {
      total +=
        id === currentViewRef.current
          ? canvas.getObjects().length
          : designsRef.current[id]?.objects?.length || 0;
    }
    propsRef.current.onDirtyChange?.(total > 0);
  }

  function emitSelection() {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) {
      propsRef.current.onSelectionChange?.(null);
      return;
    }
    if (isTextObj(obj)) {
      propsRef.current.onSelectionChange?.({
        kind: "text",
        text: obj.text,
        fontFamily: obj.fontFamily,
        fontSize: Math.round(obj.fontSize),
        fill: obj.fill,
        fontWeight: obj.fontWeight,
        fontStyle: obj.fontStyle,
        underline: !!obj.underline,
        textAlign: obj.textAlign
      });
    } else {
      propsRef.current.onSelectionChange?.({ kind: "image" });
    }
  }

  // ---- boundary event handlers ----------------------------------------------
  function onMoving(e) {
    const obj = e.target;
    const r = regionRef.current;
    obj.setCoords();
    const b = obj.getBoundingRect();
    let nx = obj.left;
    let ny = obj.top;
    if (b.left < r.x) nx += r.x - b.left;
    if (b.top < r.y) ny += r.y - b.top;
    if (b.left + b.width > r.x + r.width) nx += r.x + r.width - (b.left + b.width);
    if (b.top + b.height > r.y + r.height) ny += r.y + r.height - (b.top + b.height);
    obj.set({ left: nx, top: ny });
    obj.setCoords();
    if (within(obj, r)) snapshot(obj);
  }

  // Scaling / rotating can push a corner past the edge in ways that can't be
  // cleanly clamped, so we hold the last fully-inside transform and revert to
  // it the instant the object would overflow. This makes the boundary hard.
  function onTransformGuard(e) {
    const obj = e.target;
    if (within(obj, regionRef.current)) snapshot(obj);
    else restore(obj);
  }

  function onModified() {
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      if (!within(obj, regionRef.current)) restore(obj);
      else snapshot(obj);
    }
    flush();
    emitSelection();
  }

  function onTextChanged(e) {
    if (e.target) fitAndClamp(e.target);
    fabricRef.current.requestRenderAll();
    flush();
    emitSelection();
  }

  function drawRegion() {
    const canvas = fabricRef.current;
    if (!canvas || exportingRef.current) return;
    const r = regionRef.current;
    if (!r) return;
    const ctx = canvas.getContext();
    const isSleeve = customSleeveViews.includes(currentViewRef.current);

    ctx.save();

    // Sleeve fold / outer-edge centre guideline (visual only — never printed).
    if (isSleeve) {
      const { h } = sizeRef.current;
      const cx = r.x + r.width / 2;
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(17,16,14,0.28)";
      ctx.moveTo(cx, Math.max(0, r.y - h * 0.06));
      ctx.lineTo(cx, Math.min(h, r.y + r.height + h * 0.06));
      ctx.stroke();
    }

    // Printable-area boundary.
    ctx.fillStyle = "rgba(30,58,138,0.06)";
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(30,58,138,0.85)";
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    ctx.restore();
  }

  // ---- mount / unmount -------------------------------------------------------
  useEffect(() => {
    let disposed = false;
    (async () => {
      const fabric = await import("fabric");
      if (disposed || !canvasElRef.current) return;

      const avail = wrapRef.current?.clientWidth || 420;
      const w = Math.max(300, Math.min(460, Math.round(avail)));
      const h = Math.round(w * 1.16);
      sizeRef.current = { w, h };
      setCanvasSize({ w, h });

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: w,
        height: h,
        backgroundColor: "transparent",
        preserveObjectStacking: true,
        enableRetinaScaling: false,
        controlsAboveOverlay: true,
        selection: false
      });
      fabricRef.current = canvas;
      fabricModRef.current = fabric;
      currentViewRef.current = view;
      regionRef.current = computeRegion(view);

      canvas.on("after:render", drawRegion);
      canvas.on("object:moving", onMoving);
      canvas.on("object:scaling", onTransformGuard);
      canvas.on("object:rotating", onTransformGuard);
      canvas.on("object:modified", onModified);
      canvas.on("text:changed", onTextChanged);
      canvas.on("mouse:down", (e) => e.target && snapshot(e.target));
      canvas.on("selection:created", emitSelection);
      canvas.on("selection:updated", emitSelection);
      canvas.on("selection:cleared", emitSelection);
      canvas.on("object:added", () => !loadingRef.current && updateDirty());
      canvas.on("object:removed", () => !loadingRef.current && updateDirty());

      canvas.requestRenderAll();
      setReady(true);
      propsRef.current.onReady?.();
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard: delete / backspace removes selection (unless editing text).
  useEffect(() => {
    function onKey(e) {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj || obj.isEditing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteActive();
      } else if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        emitSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- view switching --------------------------------------------------------
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (view === currentViewRef.current) return;

    // save the outgoing view
    designsRef.current[currentViewRef.current] = canvas.toJSON();
    currentViewRef.current = view;
    regionRef.current = computeRegion(view);
    canvas.discardActiveObject();

    loadingRef.current = true;
    canvas.clear();
    canvas.backgroundColor = "transparent";

    const json = designsRef.current[view];
    const done = () => {
      canvas.getObjects().forEach((o) => {
        styleObject(o);
        o.setCoords();
        snapshot(o);
      });
      loadingRef.current = false;
      canvas.requestRenderAll();
      updateDirty();
      emitSelection();
    };

    if (json && json.objects?.length) {
      canvas.loadFromJSON(json).then(done);
    } else {
      done();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ---- delete / layers (need to be reachable by the keydown effect) ----------
  function deleteActive() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    flush();
    emitSelection();
  }

  // ---- offscreen export ------------------------------------------------------
  async function renderViewToDataURL(json, withBackground) {
    const fabric = fabricModRef.current;
    const { w, h } = sizeRef.current;
    const el = document.createElement("canvas");
    const sc = new fabric.StaticCanvas(el, {
      width: w,
      height: h,
      enableRetinaScaling: false,
      backgroundColor: withBackground ? propsRef.current.color : "transparent"
    });
    await sc.loadFromJSON(json);
    sc.renderAll();
    const url = sc.toDataURL({ format: "png", multiplier: 2 });
    sc.dispose();
    return url;
  }

  // ---- imperative API --------------------------------------------------------
  useImperativeHandle(ref, () => ({
    addText(value = "Your text") {
      const fabric = fabricModRef.current;
      if (!fabric) return;
      const t = new fabric.Textbox(value, {
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 36,
        fill: "#11100E",
        textAlign: "center",
        editable: true
      });
      addObject(t);
    },

    async addImage(dataUrl) {
      const fabric = fabricModRef.current;
      if (!fabric) return;
      const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
      addObject(img);
    },

    deleteActive,

    setProp(name, value) {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!obj) return;
      obj.set(name, value);
      if (name === "fontSize" || name === "fontFamily" || name === "text") {
        fitAndClamp(obj);
      }
      obj.setCoords();
      canvas.requestRenderAll();
      flush();
      emitSelection();
    },

    bringForward() {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!obj) return;
      canvas.bringObjectForward(obj);
      canvas.requestRenderAll();
      flush();
    },

    sendBackward() {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!obj) return;
      canvas.sendObjectBackwards(obj);
      canvas.requestRenderAll();
      flush();
    },

    clearView() {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.remove(...canvas.getObjects());
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      flush();
      emitSelection();
    },

    hasAnyObjects() {
      const canvas = fabricRef.current;
      if (!canvas) return false;
      for (const id of VIEW_IDS) {
        const n =
          id === currentViewRef.current
            ? canvas.getObjects().length
            : designsRef.current[id]?.objects?.length || 0;
        if (n > 0) return true;
      }
      return false;
    },

    // Hard-boundary safety net used before preview / add-to-cart.
    validateBounds() {
      const canvas = fabricRef.current;
      if (!canvas) return { ok: true };
      const r = regionRef.current;
      for (const obj of canvas.getObjects()) {
        if (!within(obj, r)) {
          return {
            ok: false,
            message: `A "${currentViewRef.current}" element sits outside the printable area. Nudge it back inside before continuing.`
          };
        }
      }
      return { ok: true };
    },

    async exportViews() {
      flush();
      const out = [];
      for (const id of VIEW_IDS) {
        const json = designsRef.current[id];
        if (!json?.objects?.length) continue;
        out.push({ view: id, dataUrl: await renderViewToDataURL(json, false) });
      }
      return out;
    },

    async exportThumbnail() {
      flush();
      const first =
        VIEW_IDS.find((id) => designsRef.current[id]?.objects?.length) || null;
      if (!first) return null;
      return renderViewToDataURL(designsRef.current[first], true);
    },

    getSummary() {
      const counts = {};
      let total = 0;
      for (const id of VIEW_IDS) {
        const n =
          id === currentViewRef.current
            ? fabricRef.current?.getObjects().length || 0
            : designsRef.current[id]?.objects?.length || 0;
        if (n > 0) counts[id] = n;
        total += n;
      }
      return { counts, total };
    }
  }));

  return (
    <div className="studio-stage" ref={wrapRef}>
      <div
        className="studio-canvas-frame"
        style={{ width: canvasSize.w, height: canvasSize.h }}
      >
        <div className="studio-garment" aria-hidden="true">
          <GarmentArt
            view={view}
            colorHex={color}
            colorKey={colorKey}
            mockupKey={mockupKey}
            shape={shape}
          />
        </div>
        <canvas ref={canvasElRef} className="studio-canvas" />
        {!ready && <div className="studio-canvas__loading">Preparing studio…</div>}
      </div>
      <p className="studio-stage__hint">
        Drag to move · corner handles to resize · top handle to rotate · double-click text to edit
      </p>
    </div>
  );
});
