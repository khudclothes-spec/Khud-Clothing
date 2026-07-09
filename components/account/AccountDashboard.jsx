"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/data";
import { statusLabel, statusTone, isCompletedOrder, paymentMethodLabel } from "@/lib/orders";
import { StudentVerify } from "@/components/account/StudentVerify";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

// Date + time in the viewer's local timezone — used on order cards so customers
// see exactly when an order was placed, not just the day.
function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

function OrderCard({ order }) {
  const items = order.order_items ?? [];
  const qty = items.reduce((t, i) => t + (Number(i.quantity) || 0), 0);
  return (
    <article className="order-card">
      <div className="order-card__top">
        <div>
          <div className="order-card__number">{order.order_number}</div>
          <div className="order-card__date">{fmtDateTime(order.created_at)}</div>
        </div>
        <span className={`status-pill status-pill--${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
      </div>

      <div className="order-card__items">
        {items.slice(0, 3).map((it, i) => (
          <div key={i} className="order-card__item">
            <span className="order-card__item-name">{it.products?.name ?? "Item"}</span>
            <span className="order-card__item-meta">
              {[it.color, it.size].filter(Boolean).join(" · ")} × {it.quantity}
            </span>
          </div>
        ))}
        {items.length > 3 && <div className="order-card__more">+{items.length - 3} more</div>}
      </div>

      <div className="order-card__foot">
        <div className="order-card__meta">
          <span>{qty} item{qty !== 1 ? "s" : ""}</span>
          <span className="order-card__dot">·</span>
          <span>{paymentMethodLabel(order.payment_method)}</span>
        </div>
        <div className="order-card__total">{formatPrice(order.total_amount)}</div>
      </div>

      {/* Bank-transfer order still needs its proof uploaded — a direct way in
          (a rejected payment also reverts the order to pending_payment). */}
      {order.payment_method === "online" && order.status === "pending_payment" && (
        <Link href={`/checkout/payment/${order.id}`} className="order-card__pay">
          Complete payment
        </Link>
      )}

      <Link href={`/account/orders/${order.id}`} className="order-card__link">
        View details
      </Link>
    </article>
  );
}

export function AccountDashboard({ profile, orders, stats }) {
  const supabase = createClient();
  const [form, setForm] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const firstName = (profile.fullName || "").trim().split(/\s+/)[0] || "there";

  const { current, previous } = useMemo(() => {
    const cur = [];
    const prev = [];
    (orders ?? []).forEach((o) => (isCompletedOrder(o.status) ? prev : cur).push(o));
    return { current: cur, previous: prev };
  }, [orders]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired — please sign in again.");
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || null,
          address_line1: form.addressLine1.trim() || null,
          address_line2: form.addressLine2.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postal_code: form.postalCode.trim() || null,
          country: form.country.trim() || null
        })
        .eq("id", user.id);
      if (upErr) throw new Error(upErr.message);
      setMessage("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const fullAddress = [form.addressLine1, form.addressLine2, form.city, form.state, form.postalCode, form.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="container account">
      <header className="account__head">
        <div className="eyebrow">My Account</div>
        <h1 className="display display--large">Hello, {firstName}.</h1>
        <p className="account__sub">Manage your details and track your orders.</p>
      </header>

      <div className="account__layout">
        {/* Profile */}
        <section className="account-card">
          <div className="account-card__head">
            <h2 className="account-card__title">Profile</h2>
            {!editing && (
              <button type="button" className="button button--outline button--sm" onClick={() => { setEditing(true); setMessage(""); }}>
                Edit
              </button>
            )}
          </div>

          {message && <div className="account-note account-note--ok">{message}</div>}
          {error && <div className="account-note account-note--err">{error}</div>}

          {profile.studentVerified ? (
            <div className="student-badge">Verified student{profile.studentEmail ? ` · ${profile.studentEmail}` : ""}</div>
          ) : (
            <StudentVerify />
          )}

          {!editing ? (
            <dl className="profile-list">
              <div><dt>Name</dt><dd>{form.fullName || "—"}</dd></div>
              <div><dt>Email</dt><dd>{form.email}</dd></div>
              <div><dt>Phone</dt><dd>{form.phone || "—"}</dd></div>
              <div><dt>Address</dt><dd>{fullAddress || "—"}</dd></div>
              <div><dt>Member since</dt><dd>{fmtDate(form.createdAt)}</dd></div>
            </dl>
          ) : (
            <form onSubmit={saveProfile} className="profile-form">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={form.email} disabled readOnly />
                <span className="form-hint">Email can't be changed here.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+92 300 0000000" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} placeholder="Street address" />
              </div>
              <div className="form-group">
                <input className="form-input" value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} placeholder="Apt / floor (optional)" />
              </div>
              <div className="profile-form__row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <input className="form-input" value={form.state} onChange={(e) => update("state", e.target.value)} />
                </div>
              </div>
              <div className="profile-form__row">
                <div className="form-group">
                  <label className="form-label">Postal code</label>
                  <input className="form-input" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-input" value={form.country} onChange={(e) => update("country", e.target.value)} />
                </div>
              </div>
              <div className="profile-form__foot">
                <button type="button" className="button button--outline" onClick={() => { setForm(profile); setEditing(false); setError(""); }}>Cancel</button>
                <button type="submit" className="button button--dark" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </form>
          )}

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat__value">{stats.totalOrders}</span>
              <span className="profile-stat__label">Total orders</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">{formatPrice(stats.totalSpent)}</span>
              <span className="profile-stat__label">Total spent</span>
            </div>
          </div>
        </section>

        {/* Orders */}
        <div className="account-orders">
          <section>
            <h2 className="account-section-title">Current orders</h2>
            {current.length === 0 ? (
              <div className="account-empty">
                <p>No active orders right now.</p>
                <Link href="/shop" className="button button--dark">Browse the shop</Link>
              </div>
            ) : (
              <div className="order-grid">
                {current.map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            )}
          </section>

          {previous.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <h2 className="account-section-title">Previous orders</h2>
              <div className="order-grid">
                {previous.map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
