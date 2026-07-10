"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { createClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/data";
import { PAYMENT_METHODS, orderTotals, SHIPPING_FLAT, FREE_SHIPPING_MIN_ITEMS, FREE_SHIPPING_MIN_SUBTOTAL } from "@/lib/pricing";
import { OrderComplete } from "@/components/checkout/OrderComplete";

export function CheckoutClient({ initial }) {
  const router = useRouter();
  const supabase = createClient();
  const { cart, cartCount, hydrated, subtotalNumber, placeOrder } = useCart();

  const [form, setForm] = useState({
    full_name: initial.full_name,
    email: initial.email,
    phone: initial.phone,
    address_line1: initial.address_line1,
    address_line2: initial.address_line2,
    city: initial.city,
    state: initial.state,
    postal_code: initial.postal_code,
    country: initial.country || "Pakistan",
    notes: ""
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({
    billing_name: "", billing_phone: "", billing_address_line1: "", billing_address_line2: "",
    billing_city: "", billing_state: "", billing_postal_code: "", billing_country: "Pakistan"
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, amount, message }
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  // Set on a successful COD order → swap the whole page for the completion
  // screen (which offers "view order" vs "back to home").
  const [completed, setCompleted] = useState(null);

  const totals = useMemo(
    () => orderTotals({
      subtotal: subtotalNumber,
      itemCount: cartCount,
      paymentMethod,
      promoDiscount: appliedPromo?.amount || 0
    }),
    [subtotalNumber, cartCount, paymentMethod, appliedPromo]
  );

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }
  function setBill(field, value) { setBilling((p) => ({ ...p, [field]: value })); }

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoError("");
    try {
      const { data, error: rpcErr } = await supabase.rpc("validate_promo_code", {
        p_code: code,
        p_subtotal: subtotalNumber
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (data?.valid) {
        setAppliedPromo({ code: data.code, amount: Number(data.discount_amount) || 0, message: data.message });
        setPromoError("");
      } else {
        setAppliedPromo(null);
        setPromoError(data?.message || "This code is not valid.");
      }
    } catch (e) {
      setAppliedPromo(null);
      setPromoError(e.message || "Could not check that code.");
    } finally {
      setPromoBusy(false);
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cartCount === 0) return;
    setPlacing(true);
    setError("");
    try {
      const payload = {
        ...form,
        payment_method: paymentMethod,
        promo_code: appliedPromo?.code || null,
        shipping_method: "standard",
        billing_same: billingSame,
        ...billing
      };
      const result = await placeOrder(payload);

      // Save the (possibly edited) contact + address back to the profile for
      // next time. Never fatal to the placed order.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            full_name: form.full_name.trim(),
            phone: form.phone.trim() || null,
            address_line1: form.address_line1.trim() || null,
            address_line2: form.address_line2.trim() || null,
            city: form.city.trim() || null,
            state: form.state.trim() || null,
            postal_code: form.postal_code.trim() || null,
            country: form.country.trim() || null
          }).eq("id", user.id);
        }
      } catch { /* save-back is best effort */ }

      if (result.paymentMethod === "online") {
        // Bank transfer isn't complete until the proof is uploaded — go there.
        router.push(`/checkout/payment/${result.orderId}`);
      } else {
        // COD is complete now — show the completion screen with the two choices.
        setCompleted({ orderId: result.orderId, orderNumber: result.orderNumber });
      }
    } catch (err) {
      setError(err.message || "Something went wrong placing your order.");
      setPlacing(false);
    }
  }

  // Order placed (COD): show the completion screen. Checked before the
  // empty-bag guard because the bag was just cleared on success.
  if (completed) {
    return (
      <main className="container checkout">
        <OrderComplete
          orderId={completed.orderId}
          orderNumber={completed.orderNumber}
          title="Your order is confirmed."
          message="Thank you! We've received your order and emailed your confirmation. You'll pay in cash when it arrives."
        />
      </main>
    );
  }

  // Wait for the persisted bag to load before deciding it's empty — otherwise
  // the first client render (cart still []) would flash "your bag is empty"
  // before localStorage hydrates. While hydrating we show a quiet placeholder.
  if (!hydrated) {
    return (
      <main className="container checkout">
        <div className="checkout-empty" aria-busy="true">
          <p>Loading your bag…</p>
        </div>
      </main>
    );
  }

  if (cartCount === 0) {
    return (
      <main className="container checkout">
        <div className="checkout-empty">
          <h1 className="display display--large">Your bag is empty.</h1>
          <p>Add a piece before checking out.</p>
          <Link href="/shop" className="button button--dark">Browse the shop</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container checkout">
      <header className="checkout__head">
        <div className="eyebrow">Checkout</div>
        <h1 className="display display--large">Complete your order.</h1>
      </header>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} className="checkout-layout">
        <div className="checkout-forms">
          {/* Contact */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Contact</h2>
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className="form-input" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="checkout-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={form.email} disabled readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 0000000" />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping address</h2>
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input className="form-input" required value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} placeholder="Street address" />
            </div>
            <div className="form-group">
              <input className="form-input" value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} placeholder="Apt / floor (optional)" />
            </div>
            <div className="checkout-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" required value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Province *</label>
                <input className="form-input" required value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Sindh" />
              </div>
            </div>
            <div className="checkout-row">
              <div className="form-group">
                <label className="form-label">Postal code *</label>
                <input className="form-input" required value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <input className="form-input" required value={form.country} onChange={(e) => set("country", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Billing */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Billing address</h2>
            <label className="checkout-check">
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
              <span>Same as shipping address</span>
            </label>
            {!billingSame && (
              <div className="checkout-billing">
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-input" value={billing.billing_name} onChange={(e) => setBill("billing_name", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={billing.billing_address_line1} onChange={(e) => setBill("billing_address_line1", e.target.value)} placeholder="Street address" />
                </div>
                <div className="form-group">
                  <input className="form-input" value={billing.billing_address_line2} onChange={(e) => setBill("billing_address_line2", e.target.value)} placeholder="Apt / floor (optional)" />
                </div>
                <div className="checkout-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={billing.billing_city} onChange={(e) => setBill("billing_city", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input className="form-input" value={billing.billing_state} onChange={(e) => setBill("billing_state", e.target.value)} />
                  </div>
                </div>
                <div className="checkout-row">
                  <div className="form-group">
                    <label className="form-label">Postal code</label>
                    <input className="form-input" value={billing.billing_postal_code} onChange={(e) => setBill("billing_postal_code", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={billing.billing_phone} onChange={(e) => setBill("billing_phone", e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Shipping method */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping method</h2>
            <div className="ship-method">
              <span className="ship-method__label">Standard — nationwide</span>
              <span className="ship-method__price">{totals.freeShipping ? "Free" : formatPrice(SHIPPING_FLAT)}</span>
            </div>
            <p className="checkout-hint">Free shipping on {FREE_SHIPPING_MIN_ITEMS}+ items over {formatPrice(FREE_SHIPPING_MIN_SUBTOTAL)}.</p>
          </section>

          {/* Payment */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Payment method</h2>
            <div className="pay-methods">
              {PAYMENT_METHODS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  className={`pay-method ${paymentMethod === m.value ? "is-selected" : ""}`}
                  onClick={() => setPaymentMethod(m.value)}
                  aria-pressed={paymentMethod === m.value}
                >
                  <span className="pay-method__radio" aria-hidden="true" />
                  <span className="pay-method__text">
                    <span className="pay-method__label">{m.label}</span>
                    <span className="pay-method__note">{m.note}</span>
                  </span>
                </button>
              ))}
            </div>
            {paymentMethod === "online" && (
              <p className="checkout-hint">You'll see our bank details and upload your transfer screenshot on the next step.</p>
            )}
          </section>

          {/* Notes */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Order notes <span className="form-optional">(optional)</span></h2>
            <textarea className="form-input form-textarea" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything we should know?" />
          </section>
        </div>

        {/* Summary */}
        <aside className="checkout-summary-panel">
          <h2 className="checkout-section__title">Order summary</h2>
          <div className="checkout-items">
            {cart.map((item) => (
              <div key={item.key} className="checkout-item">
                <div className="checkout-item__info">
                  <span className="checkout-item__name">{item.name}</span>
                  <span className="checkout-item__meta">{item.meta}{item.qty > 1 ? ` · ×${item.qty}` : ""}</span>
                </div>
                <span className="checkout-item__price">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Promo */}
          <div className="checkout-promo">
            {appliedPromo ? (
              <div className="checkout-promo__applied">
                <span><strong>{appliedPromo.code}</strong> applied</span>
                <button type="button" onClick={removePromo} className="checkout-promo__remove">Remove</button>
              </div>
            ) : (
              <div className="checkout-promo__row">
                <input
                  className="form-input"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                />
                <button type="button" className="button button--outline" onClick={applyPromo} disabled={promoBusy}>
                  {promoBusy ? "…" : "Apply"}
                </button>
              </div>
            )}
            {promoError && <div className="checkout-promo__error">{promoError}</div>}
          </div>

          <div className="checkout-totals">
            <div className="checkout-total-row"><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
            {totals.promoDiscount > 0 && (
              <div className="checkout-total-row checkout-total-row--discount"><span>Promo discount</span><span>−{formatPrice(totals.promoDiscount)}</span></div>
            )}
            {totals.onlineDiscount > 0 && (
              <div className="checkout-total-row checkout-total-row--discount"><span>Online payment discount</span><span>−{formatPrice(totals.onlineDiscount)}</span></div>
            )}
            <div className="checkout-total-row"><span>Shipping</span><span>{totals.freeShipping ? "Free" : formatPrice(totals.shipping)}</span></div>
            <div className="checkout-total-row checkout-total-row--grand"><span>Grand total</span><span>{formatPrice(totals.total)}</span></div>
          </div>

          <button type="submit" className="button button--dark checkout-place" disabled={placing}>
            {placing ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
          </button>
          <p className="checkout-hint checkout-hint--center">
            By placing your order you agree to Khud's terms. {paymentMethod === "cod" ? "Pay in cash on delivery." : "Complete your bank transfer next."}
          </p>
        </aside>
      </form>
    </main>
  );
}
