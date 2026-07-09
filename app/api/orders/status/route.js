import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

const ALLOWED = [
  "pending", "pending_payment", "pending_verification", "payment_received",
  "confirmed", "processing", "printing", "ready", "packed", "shipped", "delivered", "cancelled"
];

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

  // Update the status with the service-role client. No email is sent here.
  const admin = createAdminClient();
  const { error: upErr } = await admin.from("orders").update({ status }).eq("id", orderId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status });
}
