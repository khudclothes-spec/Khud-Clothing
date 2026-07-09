import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

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
  const approved = action === "approve";
  const now = new Date().toISOString();

  const { error: pvErr } = await admin
    .from("payment_verifications")
    .update({
      payment_status: approved ? "approved" : "rejected",
      verified_by: user.id,
      verified_at: now,
      admin_notes: notes ?? null
    })
    .eq("order_id", orderId);
  if (pvErr) return NextResponse.json({ error: pvErr.message }, { status: 500 });

  const newStatus = approved ? "confirmed" : "pending_payment";
  const { error: ordErr } = await admin.from("orders").update({ status: newStatus }).eq("id", orderId);
  if (ordErr) return NextResponse.json({ error: ordErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: newStatus });
}
