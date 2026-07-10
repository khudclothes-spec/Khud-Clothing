"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ChevronDown } from "@/components/Icons";
import { ORDER_STATUS, statusLabel } from "@/lib/orders";

const STATUSES = Object.keys(ORDER_STATUS);

// Show both date AND time (customer's local timezone), everywhere orders appear.
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function money(n) {
  return `Rs ${Number(n ?? 0).toLocaleString()}`;
}

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");
  // Feature 7: after any admin change, offer to notify the customer. Emails are
  // never sent automatically. { orderId, orderNumber, label, sending, result }
  const [notify, setNotify] = useState(null);
  // Surfaced when a status change is rejected server-side (e.g. out of stock).
  const [actionError, setActionError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  function askNotify(order, label) {
    setNotify({ orderId: order.id, orderNumber: order.order_number, label, sending: false, result: null });
  }

  async function sendNotify() {
    if (!notify) return;
    setNotify((n) => ({ ...n, sending: true }));
    try {
      const res = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: notify.orderId })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNotify((n) => ({ ...n, sending: false, result: data.emailed ? "sent" : "none" }));
    } catch (err) {
      console.error("[admin] notify failed", err);
      setNotify((n) => ({ ...n, sending: false, result: "error" }));
    }
  }

  // `silent` re-reads without flipping the full-page spinner (keeps expanded
  // rows / scroll intact after an in-place mutation).
  async function fetchAll(silent = false) {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, promo_code, tax, payment_method, total_amount, customer_name, customer_phone, customer_email, shipping_address, city, notes, created_at, stock_committed, order_items(id, quantity, unit_price, size, color, product_id, products(name)), payment_verifications(payment_status, payment_screenshot_path, admin_notes, uploaded_at, verified_at)")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    if (!silent) setLoading(false);
  }

  async function updateStatus(orderId, status) {
    const prevOrders = orders;
    setActionError("");
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    // Route through the API so the status is saved server-side. The customer is
    // NOT emailed automatically — after a successful save we ask the admin
    // whether to notify (Feature 7). Roll back the UI (and show why) if it fails
    // — e.g. committing a bank-transfer order whose stock has since sold out.
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status })
      });
      if (!res.ok) {
        let msg = "Could not update the status.";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      // Stock committed status may differ from what we optimistically set, so
      // refresh silently to reflect stock_committed / confirmed state.
      await fetchAll(true);
      const order = prevOrders.find((o) => o.id === orderId);
      if (order) askNotify(order, statusLabel(status));
    } catch (err) {
      console.error("[admin] status update failed", err);
      setOrders(prevOrders);
      setActionError(err.message || "Could not update the status.");
    }
  }

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Operations</div>
          <h1 className="admin-page-title">Orders</h1>
        </div>
        <div className="orders-filter">
          <select className="form-input form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading orders…</div>
      ) : visible.length === 0 ? (
        <div className="admin-empty"><p>No orders{filter !== "all" ? ` with status “${filter}”` : ""} yet.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--expandable">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const items = o.order_items ?? [];
                const itemCount = items.reduce((t, i) => t + i.quantity, 0);
                const isOpen = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr className={isOpen ? "is-expanded" : ""}>
                      <td>
                        <button type="button" className={`row-expand ${isOpen ? "is-open" : ""}`} onClick={() => setExpandedId(isOpen ? null : o.id)} aria-label={isOpen ? "Collapse" : "Expand"}>
                          <ChevronDown size={14} />
                        </button>
                      </td>
                      <td><span className="order-number">{o.order_number}</span></td>
                      <td>
                        <div className="admin-product-name">{o.customer_name}</div>
                        <div className="admin-product-slug">{o.customer_email}</div>
                      </td>
                      <td>{itemCount} item{itemCount !== 1 ? "s" : ""}</td>
                      <td>{money(o.total_amount)}</td>
                      <td>
                        <select
                          className={`order-status-select order-status--${o.status}`}
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                        </select>
                      </td>
                      <td className="order-cell-datetime">{formatDateTime(o.created_at)}</td>
                    </tr>

                    {isOpen && (
                      <tr className="admin-detail-row">
                        <td colSpan={7}>
                          <div className="admin-detail order-detail">
                            <div className="order-detail__grid">
                              <div>
                                <div className="order-detail__label">Contact</div>
                                <div className="order-detail__value">{o.customer_name}</div>
                                <div className="order-detail__value">{o.customer_phone}</div>
                                <div className="order-detail__value">{o.customer_email}</div>
                              </div>
                              <div>
                                <div className="order-detail__label">Ship to</div>
                                <div className="order-detail__value">{o.shipping_address}</div>
                                <div className="order-detail__value">{o.city}</div>
                              </div>
                              <div>
                                <div className="order-detail__label">Totals</div>
                                <div className="order-detail__value">Subtotal: {money(o.subtotal)}</div>
                                {Number(o.promo_discount) > 0 && (
                                  <div className="order-detail__value">Promo{o.promo_code ? ` (${o.promo_code})` : ""}: −{money(o.promo_discount)}</div>
                                )}
                                {Number(o.discount_amount) > 0 && (
                                  <div className="order-detail__value">Online discount: −{money(o.discount_amount)}</div>
                                )}
                                <div className="order-detail__value">Shipping: {Number(o.shipping_cost) > 0 ? money(o.shipping_cost) : "Free"}</div>
                                <div className="order-detail__value order-detail__value--strong">Total: {money(o.total_amount)}</div>
                                <div className="order-detail__value order-detail__value--muted">Payment: {o.payment_method === "online" ? "Bank Transfer" : "Cash on Delivery"}</div>
                              </div>
                            </div>

                            {o.payment_method === "online" && (
                              <AdminPaymentPanel order={o} supabase={supabase} onChanged={fetchAll} onActed={askNotify} />
                            )}

                            {o.notes && (
                              <div className="order-detail__notes">
                                <div className="order-detail__label">Notes</div>
                                <p>{o.notes}</p>
                              </div>
                            )}

                            <div className="order-detail__label" style={{ marginTop: 16 }}>Items</div>
                            <table className="variant-table">
                              <thead>
                                <tr><th>Product</th><th>Colour / Size</th><th>Qty</th><th>Unit</th><th>Line total</th></tr>
                              </thead>
                              <tbody>
                                {items.map((it) => (
                                  <tr key={it.id}>
                                    <td>{it.products?.name ?? <span className="admin-muted">Removed product</span>}</td>
                                    <td>{[it.color, it.size].filter(Boolean).join(" / ") || <span className="admin-muted">—</span>}</td>
                                    <td>{it.quantity}</td>
                                    <td>{money(it.unit_price)}</td>
                                    <td>{money(it.unit_price * it.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Server rejected a change (e.g. stock sold out before approval). */}
      {actionError && (
        <div className="admin-notify admin-notify--error" role="alert">
          <div className="admin-notify__body">
            <span className="admin-notify__msg">{actionError}</span>
            <button type="button" className="button button--outline button--sm" onClick={() => setActionError("")}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Feature 7: manual customer notification after a status/payment change. */}
      {notify && (
        <div className="admin-notify" role="status" aria-live="polite">
          {notify.result ? (
            <div className="admin-notify__body">
              <span className="admin-notify__msg">
                {notify.result === "sent"
                  ? `Email sent to the customer for ${notify.orderNumber}.`
                  : notify.result === "none"
                  ? `No email sent — the customer may have no email on file, or email delivery isn't configured yet.`
                  : `Couldn't send the email. Please try again.`}
              </span>
              <button type="button" className="button button--outline button--sm" onClick={() => setNotify(null)}>Close</button>
            </div>
          ) : (
            <div className="admin-notify__body">
              <span className="admin-notify__msg">
                <strong>Status updated.</strong> {notify.orderNumber} → {notify.label}. Notify the customer about this change?
              </span>
              <div className="admin-notify__actions">
                <button type="button" className="button button--dark button--sm" disabled={notify.sending} onClick={sendNotify}>
                  {notify.sending ? "Sending…" : "Send Email"}
                </button>
                <button type="button" className="button button--outline button--sm" disabled={notify.sending} onClick={() => setNotify(null)}>
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Admin payment verification panel ───────────────────────── */

function AdminPaymentPanel({ order, supabase, onChanged, onActed }) {
  const pvRaw = order.payment_verifications;
  const pv = Array.isArray(pvRaw) ? pvRaw[0] : pvRaw;
  const [notes, setNotes] = useState(pv?.admin_notes ?? "");
  const [signedUrl, setSignedUrl] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!pv?.payment_screenshot_path) { setSignedUrl(null); return; }
      const { data } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(pv.payment_screenshot_path, 60 * 30);
      if (active) setSignedUrl(data?.signedUrl ?? null);
    })();
    return () => { active = false; };
  }, [pv?.payment_screenshot_path, supabase]);

  async function act(action) {
    setBusy(action);
    setError("");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action, notes })
      });
      if (!res.ok) {
        let msg = "Could not update the payment. Please try again.";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      // Offer to notify the customer (approve → "Confirmed", reject → "Payment
      // rejected"). No email was sent by the API — the admin decides here.
      onActed?.(order, action === "approve" ? "Confirmed" : "Payment rejected");
      await onChanged(true);
    } catch (err) {
      setError(err.message || "Could not update the payment. Please try again.");
      console.error("[admin] payment verify failed", err);
    } finally {
      setBusy("");
    }
  }

  const status = pv?.payment_status ?? "pending";
  const statusText = {
    pending: "Awaiting payment",
    submitted: "Awaiting verification",
    approved: "Approved",
    rejected: "Rejected"
  }[status] || status;

  return (
    <div className="admin-payment">
      <div className="order-detail__label" style={{ marginTop: 16 }}>Payment verification</div>
      <div className="admin-payment__row">
        <span className={`status-pill status-pill--${status === "approved" ? "go" : status === "rejected" ? "cancelled" : "wait"}`}>
          {statusText}
        </span>
        {pv?.uploaded_at && <span className="admin-muted">Uploaded {formatDateTime(pv.uploaded_at)}</span>}
      </div>

      {pv?.payment_screenshot_path ? (
        signedUrl ? (
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="admin-payment__shot">
            View payment screenshot
          </a>
        ) : (
          <span className="admin-muted">Loading screenshot…</span>
        )
      ) : (
        <p className="admin-muted" style={{ margin: "6px 0 0" }}>Customer hasn't uploaded a receipt yet.</p>
      )}

      {error && <div className="admin-error" style={{ marginTop: 10 }}>{error}</div>}

      <textarea
        className="form-input form-textarea"
        rows={2}
        placeholder="Notes for the customer (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ marginTop: 10 }}
      />
      <div className="admin-payment__actions">
        <button type="button" className="button button--dark button--sm" disabled={!!busy || status === "approved"} onClick={() => act("approve")}>
          {busy === "approve" ? "Approving…" : "Approve payment"}
        </button>
        <button type="button" className="button button--outline button--sm" disabled={!!busy} onClick={() => act("reject")}>
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
