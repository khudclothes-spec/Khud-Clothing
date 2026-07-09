"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice, bankTransferDetails, bankTransferConfigured } from "@/lib/data";
import { PaymentUpload } from "@/components/checkout/PaymentUpload";
import { OrderComplete } from "@/components/checkout/OrderComplete";

// Client shell for the bank-transfer payment page. Owns the "completed" state so
// that, once the proof is uploaded, the whole page swaps to the completion
// screen (view order / back to home) instead of the pay-now layout — and the
// cart is only cleared at that point (checkout is complete for bank transfer
// once the proof is in).
export function PaymentPageClient({ orderId, orderNumber, totalAmount, initialStatus }) {
  const { clearCart } = useCart();
  const [completed, setCompleted] = useState(false);

  function handleComplete() {
    clearCart();
    setCompleted(true);
  }

  if (completed) {
    return (
      <main className="container checkout">
        <OrderComplete
          orderId={orderId}
          orderNumber={orderNumber}
          title="Payment proof received."
          message="Thanks! We've got your payment and will verify it shortly. We'll email you as soon as your order is confirmed."
        />
      </main>
    );
  }

  const bank = bankTransferDetails;

  return (
    <main className="container checkout">
      <header className="checkout__head">
        <div className="eyebrow">Order {orderNumber}</div>
        <h1 className="display display--large">Complete your payment.</h1>
        <p className="account__sub">Transfer the total below, then upload your receipt so we can verify and confirm your order.</p>
      </header>

      <div className="pay-page-grid">
        <section className="account-card">
          <h2 className="account-card__title">Bank transfer details</h2>
          {bankTransferConfigured ? (
            <dl className="bank-details">
              {bank.bankName && <div><dt>Bank</dt><dd>{bank.bankName}</dd></div>}
              {bank.accountTitle && <div><dt>Account title</dt><dd>{bank.accountTitle}</dd></div>}
              {bank.accountNumber && <div><dt>Account number</dt><dd>{bank.accountNumber}</dd></div>}
              {bank.iban && <div><dt>IBAN</dt><dd>{bank.iban}</dd></div>}
            </dl>
          ) : (
            <p className="checkout-hint">Our bank details aren't configured yet — please contact us to complete your transfer.</p>
          )}
          <div className="bank-amount">
            <span>Amount to transfer</span>
            <strong>{formatPrice(totalAmount)}</strong>
          </div>
          <p className="checkout-hint">Please use your order number <strong>{orderNumber}</strong> as the payment reference.</p>
        </section>

        <section className="account-card">
          <h2 className="account-card__title">Upload payment proof</h2>
          <PaymentUpload
            orderId={orderId}
            orderNumber={orderNumber}
            initialStatus={initialStatus}
            onComplete={handleComplete}
          />
        </section>
      </div>
    </main>
  );
}
