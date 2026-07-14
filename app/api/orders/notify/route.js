import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { sendOrderStatusEmail, sendPaymentStatusEmail } from "@/lib/email/orders";
import { shouldEmailStatus } from "@/emails/orderStatusUpdate";

// This route decides what to email from the order's CURRENT DB state — it must
// never be served from a cache (Next.js can otherwise cache route handler
// fetches), or "Send Email" can act on a stale status right after an admin
// approval/status change.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ORDER_SELECT =
  "id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, promo_code, tax, payment_method, total_amount, customer_name, customer_phone, customer_email, shipping_address, city, notes, created_at, order_items(id, quantity, unit_price, size, color, products(name)), payment_verifications(payment_status, admin_notes)";

// Admin-only. Explicitly notifies the customer about an order's CURRENT state.
// Called only when the admin presses "Send Email" after a status change or a
// payment approve/reject (Feature 7 — emails are never sent automatically).
//
// The email is chosen from the order's current state:
//   • a lifecycle status with a template (confirmed / processing / printing /
//     packed / shipped / delivered / cancelled) → that status update email
//   • otherwise, a rejected bank-transfer payment → the payment-rejected email
//   • anything else → nothing to send (skipped)
export async function POST(request) {
  let orderId;
  try {
    ({ orderId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  // Verify the caller is an admin.
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const pvRaw = order.payment_verifications;
  const pv = Array.isArray(pvRaw) ? pvRaw[0] : pvRaw;

  try {
    if (shouldEmailStatus(order.status)) {
      const res = await sendOrderStatusEmail(order, order.status);
      return NextResponse.json({ ok: true, emailed: !res?.skipped, kind: "status", status: order.status, reason: res?.skipped ? (order.customer_email ? "no_api_key" : "no_customer_email") : undefined });
    }
    if (pv?.payment_status === "rejected") {
      const res = await sendPaymentStatusEmail(order, "rejected", pv.admin_notes || "");
      return NextResponse.json({ ok: true, emailed: !res?.skipped, kind: "payment_rejected", reason: res?.skipped ? (order.customer_email ? "no_api_key" : "no_customer_email") : undefined });
    }
    // No customer-facing template for this state (e.g. pending_payment /
    // pending_verification) — nothing to send.
    return NextResponse.json({ ok: true, emailed: false, skipped: "no_template", status: order.status });
  } catch (err) {
    // Admin-only route — safe (and, for a delivery failure like a Resend
    // rejection or unverified sending domain, essential) to surface the
    // real provider error instead of a generic message.
    console.error("[api/orders/notify] email failed", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
