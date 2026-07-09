import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { formatPrice } from "@/lib/data";
import {
  statusLabel,
  statusTone,
  paymentMethodLabel,
  timelineFor
} from "@/lib/orders";

export const metadata = { title: "Order details — Khud", robots: "noindex" };

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

const ORDER_SELECT =
  "id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, promo_code, tax, total_amount, payment_method, customer_name, customer_phone, customer_email, shipping_address, city, shipping_state, shipping_postal_code, shipping_country, billing_name, billing_phone, billing_address, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, order_items(id, quantity, unit_price, size, color, products(name, slug))";

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const supabase = await createServerClient();

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }
  if (!user) redirect(`/login?redirect=/account/orders/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  // Payment verification + a short-lived signed URL for the screenshot.
  let payment = null;
  let screenshotUrl = null;
  if (order.payment_method === "online") {
    const { data: pv } = await supabase
      .from("payment_verifications")
      .select("payment_status, payment_screenshot_path, admin_notes, uploaded_at, verified_at")
      .eq("order_id", order.id)
      .maybeSingle();
    payment = pv ?? null;
    if (pv?.payment_screenshot_path) {
      const { data: signed } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(pv.payment_screenshot_path, 60 * 30);
      screenshotUrl = signed?.signedUrl ?? null;
    }
  }

  const items = order.order_items ?? [];
  const timeline = timelineFor(order.payment_method);
  const cancelled = order.status === "cancelled";
  // Map any legacy "ready" rows onto the current "packed" step for progress
  // display. "processing" and "printing" are now distinct timeline steps.
  const effectiveStatus = order.status === "ready" ? "packed" : order.status;
  const currentIdx = timeline.indexOf(effectiveStatus);

  const shipping = [
    order.shipping_address,
    order.city,
    order.shipping_state,
    order.shipping_postal_code,
    order.shipping_country
  ].filter(Boolean).join(", ");

  const billing = [
    order.billing_address,
    order.billing_city,
    order.billing_state,
    order.billing_postal_code,
    order.billing_country
  ].filter(Boolean).join(", ");

  const onlineDiscount = Number(order.discount_amount) || 0;
  const promoDiscount = Number(order.promo_discount) || 0;
  const shippingCost = Number(order.shipping_cost) || 0;
  // Current payment-proof state ("pending" when no verification row exists yet).
  const payStatus = payment?.payment_status ?? "pending";

  return (
    <main className="container order-details">
      <nav className="pd-crumbs">
        <Link href="/account" className="crumb-link">My Account</Link>
        {" / "}
        <span>{order.order_number}</span>
      </nav>

      <header className="order-details__head">
        <div>
          <div className="eyebrow">Order</div>
          <h1 className="display display--large">{order.order_number}</h1>
          <p className="account__sub">Placed {fmtDateTime(order.created_at)}</p>
        </div>
        <span className={`status-pill status-pill--${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
      </header>

      {/* Timeline */}
      <section className="order-timeline" aria-label="Order timeline">
        {cancelled ? (
          <div className="order-timeline__cancelled">This order was cancelled.</div>
        ) : (
          <ol className="timeline">
            {timeline.map((step, i) => {
              const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "upcoming";
              return (
                <li key={step} className={`timeline__step timeline__step--${state}`}>
                  <span className="timeline__dot" />
                  <span className="timeline__label">{statusLabel(step)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="order-details__grid">
        {/* Left: items + totals */}
        <div className="order-details__main">
          <section className="account-card">
            <h2 className="account-card__title">Items</h2>
            <table className="order-items-table">
              <thead>
                <tr><th>Product</th><th>Colour / Size</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      {it.products?.slug
                        ? <Link href={`/product/${it.products.slug}`} className="crumb-link">{it.products.name}</Link>
                        : (it.products?.name ?? "Item")}
                    </td>
                    <td>{[it.color, it.size].filter(Boolean).join(" / ") || "—"}</td>
                    <td>{it.quantity}</td>
                    <td>{formatPrice(it.unit_price)}</td>
                    <td>{formatPrice(it.unit_price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="order-totals">
              <div className="order-totals__row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {promoDiscount > 0 && (
                <div className="order-totals__row order-totals__row--discount">
                  <span>Promo discount{order.promo_code ? ` (${order.promo_code})` : ""}</span>
                  <span>−{formatPrice(promoDiscount)}</span>
                </div>
              )}
              {onlineDiscount > 0 && (
                <div className="order-totals__row order-totals__row--discount">
                  <span>Online payment discount</span>
                  <span>−{formatPrice(onlineDiscount)}</span>
                </div>
              )}
              <div className="order-totals__row"><span>Shipping</span><span>{shippingCost > 0 ? formatPrice(shippingCost) : "Free"}</span></div>
              <div className="order-totals__row order-totals__row--grand"><span>Grand total</span><span>{formatPrice(order.total_amount)}</span></div>
            </div>
          </section>

          {order.notes && (
            <section className="account-card">
              <h2 className="account-card__title">Notes</h2>
              <p className="order-notes">{order.notes}</p>
            </section>
          )}
        </div>

        {/* Right: addresses + payment */}
        <aside className="order-details__side">
          <section className="account-card">
            <h2 className="account-card__title">Shipping address</h2>
            <div className="address-block">
              <strong>{order.customer_name}</strong>
              <span>{shipping || "—"}</span>
              {order.customer_phone && <span>{order.customer_phone}</span>}
            </div>
          </section>

          {billing && (
            <section className="account-card">
              <h2 className="account-card__title">Billing address</h2>
              <div className="address-block">
                <strong>{order.billing_name || order.customer_name}</strong>
                <span>{billing}</span>
                {order.billing_phone && <span>{order.billing_phone}</span>}
              </div>
            </section>
          )}

          <section className="account-card">
            <h2 className="account-card__title">Payment</h2>
            <div className="address-block">
              <span>{paymentMethodLabel(order.payment_method)}</span>
              {payment && (
                <span className={`status-pill status-pill--${payment.payment_status === "approved" ? "go" : payment.payment_status === "rejected" ? "cancelled" : "wait"}`}>
                  {payment.payment_status === "approved" ? "Payment approved"
                    : payment.payment_status === "rejected" ? "Payment rejected"
                    : payment.payment_status === "submitted" ? "Awaiting verification"
                    : "Awaiting payment"}
                </span>
              )}
            </div>
            {screenshotUrl && (
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="payment-shot-link">
                View payment screenshot
              </a>
            )}
            {payment?.admin_notes && <p className="order-notes">{payment.admin_notes}</p>}

            {/* Let the customer finish (or fix) a bank transfer straight from
                their order. Actionable until the payment is approved. */}
            {order.payment_method === "online" && order.status !== "cancelled" && payStatus !== "approved" && (
              <Link href={`/checkout/payment/${order.id}`} className="button button--dark button--sm payment-cta">
                {payStatus === "submitted"
                  ? "Replace payment screenshot"
                  : payStatus === "rejected"
                  ? "Re-upload payment proof"
                  : "Upload payment proof"}
              </Link>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
