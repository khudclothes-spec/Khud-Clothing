import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendPaymentSubmittedEmails } from "@/lib/email/orders";

// Reads live order state right after submit_payment_proof() writes it — must
// never be cached.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ORDER_SELECT =
  "id, order_number, status, subtotal, shipping_cost, discount_amount, promo_discount, tax, total_amount, payment_method, customer_name, customer_email, created_at, profile_id, order_items(id, quantity, unit_price, size, color, products(name))";

// Fired (best effort) after a customer uploads their bank-transfer proof. Sends
// the customer acknowledgement + owner "please verify" notifications. The proof
// itself is already recorded server-side by submit_payment_proof().
export async function POST(request) {
  let orderId;
  try {
    ({ orderId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const result = await sendPaymentSubmittedEmails(order);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/payments/submitted] email failed", err);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
