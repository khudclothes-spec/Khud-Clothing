"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const ACCEPTED = [
  "image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"
];
const ACCEPT_ATTR = ".png,.jpg,.jpeg,.webp,.pdf";

function extFor(file) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function PaymentUpload({ orderId, orderNumber, initialStatus, onComplete }) {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(initialStatus);

  // Only an *approved* payment locks the form. A submitted (awaiting-verification)
  // proof can still be replaced, and a rejected one re-uploaded — the backend
  // (storage upsert + submit_payment_proof) overwrites the previous screenshot.
  const locked = status === "approved";
  const isSubmitted = status === "submitted";
  const isRejected = status === "rejected";

  function pick(e) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    if (f && !ACCEPTED.includes(f.type)) {
      setError("Please upload a PNG, JPG, WEBP or PDF.");
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired — please sign in again.");

      const path = `${user.id}/${orderId}.${extFor(file)}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);

      const { data, error: rpcErr } = await supabase.rpc("submit_payment_proof", {
        p_order_id: orderId,
        p_path: path
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (!data?.ok) throw new Error(data?.error || "Could not record your payment.");

      // Best-effort owner notification (Phase 7 email); never blocks the flow.
      fetch("/api/payments/submitted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      }).catch(() => {});

      setStatus("submitted");
      // Checkout is now fully complete — hand off to the parent, which clears
      // the bag and shows the completion screen (view order / back to home).
      onComplete?.();
    } catch (e) {
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <div className="account-note account-note--ok" style={{ marginBottom: 0 }}>
        Your payment has been approved.
        <div style={{ marginTop: 12 }}>
          <button type="button" className="button button--outline button--sm" onClick={() => router.push(`/account/orders/${orderId}`)}>
            View order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-upload">
      {error && <div className="account-note account-note--err">{error}</div>}
      {isSubmitted && (
        <div className="account-note account-note--ok" style={{ marginBottom: 12 }}>
          Your payment proof is in and awaiting verification. Sent the wrong image? Upload a new one below to replace it.
        </div>
      )}
      {isRejected && (
        <div className="account-note account-note--err" style={{ marginBottom: 12 }}>
          Your previous payment proof wasn't verified. Please upload a clearer screenshot.
        </div>
      )}
      <label className="file-drop">
        <input type="file" accept={ACCEPT_ATTR} onChange={pick} hidden />
        <span className="file-drop__label">
          {file ? file.name : isSubmitted ? "Choose a new screenshot or PDF" : "Choose a screenshot or PDF"}
        </span>
        <span className="file-drop__hint">PNG, JPG, WEBP or PDF</span>
      </label>
      <button type="button" className="button button--dark" onClick={upload} disabled={!file || busy} style={{ width: "100%", marginTop: 14 }}>
        {busy ? "Uploading…" : isSubmitted ? "Replace payment proof" : "Submit payment proof"}
      </button>
      <p className="checkout-hint checkout-hint--center">Reference: {orderNumber}</p>
    </div>
  );
}
