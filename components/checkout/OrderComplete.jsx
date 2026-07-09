"use client";

import { useRouter } from "next/navigation";

// Shown once an order is fully complete — COD confirmed at checkout, or a
// bank-transfer proof uploaded. It offers the only two post-checkout
// destinations: the customer's order in their dashboard, or the home page.
export function OrderComplete({ orderId, orderNumber, title, message }) {
  const router = useRouter();
  return (
    <div className="order-complete">
      <span className="order-complete__check" aria-hidden="true">✓</span>
      <h1 className="order-complete__title">{title}</h1>
      {orderNumber && <p className="order-complete__ref">Order {orderNumber}</p>}
      {message && <p className="order-complete__msg">{message}</p>}
      <p className="order-complete__ask">Would you like to view your order in your dashboard?</p>
      <div className="order-complete__actions">
        <button type="button" className="button button--dark" onClick={() => router.push(`/account/orders/${orderId}`)}>
          Yes, view my order
        </button>
        <button type="button" className="button button--outline" onClick={() => router.push("/")}>
          No, back to home
        </button>
      </div>
    </div>
  );
}
