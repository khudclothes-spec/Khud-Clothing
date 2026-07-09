import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { sendOrderConfirmationEmails } from "@/lib/email/orders";

const ORDER_SELECT =
  "id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, promo_code, tax, payment_method, total_amount, customer_name, customer_phone, customer_email, shipping_address, city, notes, created_at, profile_id, confirmation_sent_at, order_items(id, quantity, unit_price, size, color, products(name))";

// Called by the client right after a successful checkout. It never receives
// email content from the client — only the order id — and sends everything
// server-side. Idempotent via orders.confirmation_sent_at.
export async function POST(request) {
  let orderId;
  try {
    ({ orderId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  // Authenticate the requester.
  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  // Service-role read/write (bypasses RLS) — but we verify ownership first.
  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.profile_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only send the "Order Confirmed" email once the order is actually confirmed.
  // COD orders are created 'confirmed' (email now). Bank-transfer orders start
  // 'pending_payment' and are NOT emailed here — their confirmation is sent
  // later, when an admin confirms the order (manual notify).
  if (order.status !== "confirmed") {
    return NextResponse.json({ ok: true, skipped: "not_confirmed", status: order.status });
  }

  // Idempotent: only send once.
  if (order.confirmation_sent_at) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  try {
    const result = await sendOrderConfirmationEmails(order);
    await admin.from("orders").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", order.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/orders/confirm] failed", err);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
