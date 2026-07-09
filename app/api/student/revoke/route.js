import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

// Admin-only: revoke a customer's student verification. Uses the service-role
// client because the profiles trigger blocks direct client writes to the
// student_* columns.
export async function POST(request) {
  let profileId;
  try {
    ({ profileId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!profileId) return NextResponse.json({ error: "Missing profileId" }, { status: 400 });

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
  const { error } = await admin
    .from("profiles")
    .update({ student_verified: false, student_verified_at: null, student_email: null })
    .eq("id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
