"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff } from "@/components/Icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const supabase = createClient();

  // Runs client-side only (so window is safe here). If Supabase bounced the user
  // back with ?error=, show it. If a ?code= link was used (same-browser PKCE),
  // exchange it for the recovery session so updateUser() below can succeed.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("error")) {
      setError("This reset link is invalid or has expired. Request a new one.");
    }
    const code = p.get("code");
    if (code) supabase.auth.exchangeCodeForSession(code).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    // Must have the recovery session (set when the email link was verified)
    // before we can change the password. If it's missing, the link is the real
    // problem; if it's present, any failure below is something else entirely.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Your reset session isn't active. Open the most recent reset link again (and in the same browser).");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // Surface the actual reason instead of always blaming an expired link.
      const msg = updateError.message || "";
      if (/different from the old password/i.test(msg)) {
        setError("Your new password must be different from your current one.");
      } else if (/should be at least|weak|pwned/i.test(msg)) {
        setError(msg);
      } else if (/session|expired|token|missing|JWT/i.test(msg)) {
        setError("The reset link has expired or was already used. Request a new one.");
      } else {
        setError(msg || "Unable to update password. Please try again.");
      }
      console.error("[reset-password] updateUser failed:", updateError.status, updateError.code, msg);
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/images/charmeem-logo-black.png" alt="Char Meem Clothing logo" className="auth-logo" />
        </div>

        <h2 className="auth-heading">New Password</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="password-wrap">
              <input
                type={showPw ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                autoComplete="new-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          <button type="submit" className="button button--dark auth-submit" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
