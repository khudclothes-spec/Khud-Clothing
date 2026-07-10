import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { sendCustomerOrderConfirmation, sendOwnerNewOrderEmails } from "@/lib/email/orders";

const ORDER_SELECT =
  "id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, promo_code, tax, payment_method, total_amount, customer_name, customer_phone, customer_email, shipping_address, city, notes, created_at, profile_id, confirmation_sent_at, owner_notified_at, order_items(id, quantity, unit_price, size, color, products(name))";

// Called by the client right after a successful checkout (for EVERY order). It
// never receives email content — only the order id — and sends server-side:
//   • the four owners get a "new order placed" email once (any payment method)
//   • the customer gets their confirmation once, but only for COD orders that
//     are already 'confirmed' (bank-transfer confirmations are sent later, when
//     an admin confirms the order).
// Each send is separately idempotent (owner_notified_at / confirmation_sent_at).
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

  const now = new Date().toISOString();
  let ownerNotified = false;
  let customerConfirmed = false;

  // 1) Owners: "new order placed" — once, for any order (COD or bank transfer).
  if (!order.owner_notified_at) {
    try {
      await sendOwnerNewOrderEmails(order);
      await admin.from("orders").update({ owner_notified_at: now }).eq("id", order.id);
      ownerNotified = true;
    } catch (err) {
      console.error("[api/orders/confirm] owner emails failed", err);
    }
  }

  // 2) Customer confirmation — only for COD (already 'confirmed'), once.
  if (order.status === "confirmed" && !order.confirmation_sent_at) {
    try {
      await sendCustomerOrderConfirmation(order);
      await admin.from("orders").update({ confirmation_sent_at: now }).eq("id", order.id);
      customerConfirmed = true;
    } catch (err) {
      console.error("[api/orders/confirm] customer confirmation failed", err);
    }
  }

  return NextResponse.json({ ok: true, ownerNotified, customerConfirmed });
}
