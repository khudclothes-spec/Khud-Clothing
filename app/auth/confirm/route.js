import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

// Server-side email confirmation (Supabase SSR pattern). The confirmation email
// links here with a one-time token_hash. verifyOtp confirms the email AND sets
// the session cookies server-side (works on any device — no PKCE verifier), so
// the redirect lands the user already signed in.
//   Email link → GET /auth/confirm?token_hash=…&type=signup&next=/
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (tokenHash && type) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      // Session cookies are set — send them in, logged in.
      redirect(next);
    }
    console.error("[auth/confirm] verifyOtp failed", error?.status, error?.code, error?.message);
  }

  // Missing/expired/used token → back to the verify page with a friendly notice.
  redirect("/verify-email?error=link");
}
