import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

// Mutates order/payment state that other routes immediately re-read
// (POST /api/orders/notify) — must never be cached.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Admin-only. Approves or rejects a manual bank-transfer payment:
//   approve → payment_verifications.approved + order 'confirmed'
//   reject  → payment_verifications.rejected + order back to 'pending_payment'
// No email is sent here — the admin chooses to notify the customer afterwards
// via POST /api/orders/notify (Feature 7: no accidental emails).
export async function POST(request) {
  let orderId, action, notes;
  try {
    ({ orderId, action, notes } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!orderId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Missing orderId or invalid action" }, { status: 400 });
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

  if (action === "approve") {
    // Commit stock atomically (locks variants + RE-CHECKS availability), mark the
    // payment approved, and confirm the order — all in one RPC. Stock is only
    // ever decremented here for bank-transfer orders.
    const { data, error } = await admin.rpc("confirm_order_payment", {
      p_order_id: orderId,
      p_verified_by: user.id,
      p_notes: notes ?? null
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.ok) {
      if (data?.error === "OUT_OF_STOCK") {
        const variant = [data.color, data.size].filter(Boolean).join(" · ");
        const label = `${data.name || "An item"}${variant ? ` (${variant})` : ""}`;
        return NextResponse.json(
          { error: `Can't approve — ${label} is out of stock (only ${data.available ?? 0} left, order needs ${data.requested}). Restock it or cancel the order.`, code: "OUT_OF_STOCK" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: data?.error || "Could not approve payment." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  // Reject: record the rejection + send the order back to await a fresh proof.
  // No stock is involved (online orders never reserve stock until approval).
  const { error: pvErr } = await admin
    .from("payment_verifications")
    .update({
      payment_status: "rejected",
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      admin_notes: notes ?? null
    })
    .eq("order_id", orderId);
  if (pvErr) return NextResponse.json({ error: pvErr.message }, { status: 500 });

  const { error: ordErr } = await admin.from("orders").update({ status: "pending_payment" }).eq("id", orderId);
  if (ordErr) return NextResponse.json({ error: ordErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: "pending_payment" });
}
