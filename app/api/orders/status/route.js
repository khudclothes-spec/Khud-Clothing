import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { sendOrderStatusEmail } from "@/lib/email/orders";

const ALLOWED = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const ORDER_SELECT =
  "id, order_number, status, customer_name, customer_email, customer_phone, created_at, order_items(id, quantity, unit_price, size, color, products(name))";

// Admin-only: updates an order's status AND emails the customer about the
// change, all server-side. The admin dashboard calls this instead of writing
// the status directly, so the email can never be skipped or sent from a client.
export async function POST(request) {
  let orderId, status;
  try {
    ({ orderId, status } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!orderId || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Missing orderId or invalid status" }, { status: 400 });
  }

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

  // Update + re-read with the service-role client.
  const admin = createAdminClient();
  const { error: upErr } = await admin.from("orders").update({ status }).eq("id", orderId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: order } = await admin.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();

  // Email the customer (non-fatal: status is already saved).
  let emailed = false;
  if (order) {
    try {
      const res = await sendOrderStatusEmail(order, status);
      emailed = !res?.skipped;
    } catch (err) {
      console.error("[api/orders/status] email failed", err);
    }
  }

  return NextResponse.json({ ok: true, status, emailed });
}
