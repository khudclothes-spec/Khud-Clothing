"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff } from "@/components/Icons";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  const supabase = createClient();

  // Turn an opaque Supabase auth error (often an empty {} when GoTrue can't send
  // the confirmation email) into something actionable.
  function friendlyAuthError(err) {
    const raw = (err?.message ?? "").toString().trim();
    const low = raw.toLowerCase();
    const status = err?.status;
    const code = (err?.code ?? "").toLowerCase();

    if (low.includes("rate limit") || status === 429 || code.includes("rate_limit")) {
      return "Supabase's email rate limit was hit, so the account couldn't be created. Wait ~1 hour, or (better) set up custom SMTP in Supabase → Authentication → Emails so confirmation emails actually send.";
    }
    if (low.includes("sending") && low.includes("email")) {
      return "The confirmation email couldn't be sent — Supabase email isn't set up. In Supabase → Authentication → Emails, configure SMTP (e.g. Resend), or turn off 'Confirm email' to allow instant sign-up.";
    }
    if (low.includes("database error")) {
      return "Sign-up failed on the database side (the profile-creation trigger likely errored). Check Supabase → Logs → Auth for the exact reason.";
    }
    if (low.includes("already registered") || low.includes("already been registered") || code.includes("already")) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (!raw || raw === "{}" || raw === "[object Object]") {
      return "Couldn't create your account. This is almost always because Supabase can't send the confirmation email (unconfigured or rate-limited). Set up SMTP in Supabase → Authentication → Emails, or temporarily disable 'Confirm email'.";
    }
    return raw;
  }

  // A safe internal return path from ?redirect=, or null.
  function safeRedirect() {
    if (typeof window === "undefined") return null;
    const next = new URLSearchParams(window.location.search).get("redirect");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return null;
  }

  async function redirectByRole(userId) {
    // Step 2 — confirm the session is alive in the browser client
    const { data: { user: authUser } } = await supabase.auth.getUser();
    console.log("[khud] auth user:", authUser);
    console.log("[khud] auth uid:", authUser?.id);

    // Step 5 — maybeSingle distinguishes "0 rows" from "error"
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Step 1 — full error detail
    console.log("[khud] userId:", userId);
    console.log("[khud] profile:", profile);
    console.log("[khud] error:", JSON.stringify(error, null, 2));

    // Step 7 — safe redirect, never silently swallow a null profile
    if (error) {
      console.error("[khud] profiles query failed:", error.message, error.code);
      setError(`Could not load your profile (${error.code ?? error.message}). Try signing in again.`);
      setLoading(false);
      return;
    }

    if (!profile) {
      console.error("[khud] profile row missing for uid:", userId);
      setError("Profile not found. Contact support.");
      setLoading(false);
      return;
    }

    // Honour a safe ?redirect= for everyone (e.g. return to checkout); else
    // fall back to a role-based landing.
    const next = safeRedirect();
    router.push(next || (profile.role === "admin" ? "/admin" : "/"));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Your email isn't confirmed yet. Check your inbox for the verification link, or ask an admin to disable email confirmation in Supabase.");
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    await redirectByRole(data.user.id);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: { full_name: signupData.full_name },
        // After the user clicks the confirmation link, bring them back to the
        // app so the browser session is established and the verify page can
        // detect it and continue automatically.
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });

    if (authError) {
      console.error("[khud] signup failed:", authError.status, authError.code, authError.message);
      setError(friendlyAuthError(authError));
      setLoading(false);
      return;
    }

    // Update phone if provided (trigger already created the profiles row)
    if (data.user && signupData.phone) {
      await supabase
        .from("profiles")
        .update({ phone: signupData.phone })
        .eq("id", data.user.id);
    }

    // If Supabase returned a session, email confirmation is off — redirect immediately
    if (data.session) {
      await redirectByRole(data.user.id);
      return;
    }

    // Confirmation is enabled — send them to the dedicated verify-email page,
    // which shows the "check your inbox" state, polls for verification, and
    // offers a resend button.
    router.push(`/verify-email?email=${encodeURIComponent(signupData.email)}`);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/images/logo-black-writing.png" alt="Khud" className="auth-logo" />
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "is-active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "is-active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className={`auth-error`}>{error}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrap">
                <input
                  type={showLoginPw ? "text" : "password"}
                  className="form-input"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowLoginPw((v) => !v)} aria-label={showLoginPw ? "Hide password" : "Show password"}>
                  {showLoginPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="form-footer">
              <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>
            <button type="submit" className="button button--dark auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={signupData.full_name}
                onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrap">
                <input
                  type={showSignupPw ? "text" : "password"}
                  className="form-input"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowSignupPw((v) => !v)} aria-label={showSignupPw ? "Hide password" : "Show password"}>
                  {showSignupPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone <span className="form-optional">(optional)</span></label>
              <input
                type="tel"
                className="form-input"
                value={signupData.phone}
                onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                placeholder="+92 300 0000000"
                autoComplete="tel"
              />
            </div>
            <button type="submit" className="button button--dark auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
