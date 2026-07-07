"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ChevronDown } from "@/components/Icons";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, subtotal, shipping_cost, discount_amount, payment_method, total_amount, customer_name, customer_phone, customer_email, shipping_address, city, notes, created_at, order_items(id, quantity, unit_price, size, color, product_id, products(name))")
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  async function updateStatus(orderId, status) {
    const prevOrders = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    // Route through the API so the status is saved AND the customer is emailed
    // about the change, all server-side. Roll back the UI if it fails.
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status })
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("[admin] status update failed", err);
      setOrders(prevOrders);
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
            {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
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
                          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                      <td>{formatDate(o.created_at)}</td>
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
                                {Number(o.discount_amount) > 0 && (
                                  <div className="order-detail__value">Discount: −{money(o.discount_amount)}</div>
                                )}
                                <div className="order-detail__value">Shipping: {Number(o.shipping_cost) > 0 ? money(o.shipping_cost) : "Free"}</div>
                                <div className="order-detail__value order-detail__value--strong">Total: {money(o.total_amount)}</div>
                                <div className="order-detail__value order-detail__value--muted">Payment: {o.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}</div>
                              </div>
                            </div>

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
    </div>
  );
}
