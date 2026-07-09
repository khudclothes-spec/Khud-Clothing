import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import { sendStudentVerificationEmail } from "@/lib/email/student";

// Authenticated customer requests student verification for a university email.
// Validates the domain against the admin allow-list, issues a one-time token
// (server-side), stores it, and emails it. The token is entered back on the
// account page and consumed by the verify_student_token() RPC.
export async function POST(request) {
  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  email = String(email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const supabase = await createServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();

  // Already verified? Nothing to do (verification happens once).
  const { data: profile } = await admin
    .from("profiles")
    .select("student_verified, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.student_verified) {
    return NextResponse.json({ error: "Your account is already verified." }, { status: 400 });
  }

  // Validate the domain against the active allow-list.
  const domain = email.split("@")[1];
  const { data: allowed } = await admin
    .from("student_email_domains")
    .select("domain")
    .eq("is_active", true);
  const domains = (allowed ?? []).map((d) => d.domain.toLowerCase());
  if (domains.length > 0 && !domains.includes(domain)) {
    return NextResponse.json(
      { error: "That email domain isn't on our approved university list." },
      { status: 400 }
    );
  }

  // Issue + store a one-time token (24h).
  const token = crypto.randomBytes(6).toString("hex").toUpperCase();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: insErr } = await admin.from("student_verification_tokens").insert({
    profile_id: user.id,
    email,
    token,
    expires_at: expires
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Email it (non-fatal — no-ops if Resend isn't configured).
  try {
    await sendStudentVerificationEmail(email, token, profile?.full_name);
  } catch (err) {
    console.error("[api/student/request] email failed", err);
  }

  return NextResponse.json({ ok: true });
}
