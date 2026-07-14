import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

// Mutates order status that /api/orders/notify immediately re-reads — must
// never be cached.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ALLOWED = [
  "pending", "pending_payment", "pending_verification", "payment_received",
  "confirmed", "processing", "printing", "ready", "packed", "shipped", "delivered", "cancelled"
];

// Statuses that mean the order is committed to production/fulfilment. Moving an
// online order into any of these must first commit (reserve) its stock.
const COMMITTED = ["confirmed", "processing", "printing", "ready", "packed", "shipped", "delivered"];

// Admin-only: updates an order's status. It does NOT email the customer — the
// admin explicitly chooses to notify afterwards via POST /api/orders/notify.
// This prevents accidental emails from a mistaken status change (Feature 7).
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

  const admin = createAdminClient();

  // A bank-transfer order reserves no stock until it's committed. If an admin
  // moves such an order into a committed status directly (instead of using the
  // Approve Payment button), commit its stock atomically first — same RPC, same
  // re-check — so inventory can never drift.
  const { data: order } = await admin
    .from("orders")
    .select("payment_method, stock_committed, status")
    .eq("id", orderId)
    .maybeSingle();

  if (order && order.payment_method === "online" && !order.stock_committed && COMMITTED.includes(status)) {
    const { data, error } = await admin.rpc("confirm_order_payment", {
      p_order_id: orderId,
      p_verified_by: user.id,
      p_notes: null
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.ok) {
      if (data?.error === "OUT_OF_STOCK") {
        const variant = [data.color, data.size].filter(Boolean).join(" · ");
        const label = `${data.name || "An item"}${variant ? ` (${variant})` : ""}`;
        return NextResponse.json(
          { error: `Can't confirm — ${label} is out of stock (only ${data.available ?? 0} left, needs ${data.requested}). Restock it or cancel the order.`, code: "OUT_OF_STOCK" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: data?.error || "Could not commit the order." }, { status: 400 });
    }
    // confirm_order_payment set the order to 'confirmed'; apply the requested
    // status if the admin asked for a later step.
    if (status !== "confirmed") {
      const { error: upErr } = await admin.from("orders").update({ status }).eq("id", orderId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status });
  }

  // Otherwise just save the status. No email is sent here (Feature 7).
  const { error: upErr } = await admin.from("orders").update({ status }).eq("id", orderId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status });
}
