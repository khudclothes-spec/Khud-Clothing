"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    });

    // Always show success — never confirm whether email exists
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/images/logo-black-writing.png" alt="Khud" className="auth-logo" />
        </div>

        <h2 className="auth-heading">Reset Password</h2>

        {sent ? (
          <div className="auth-message">
            <div className="auth-success">If that email is registered, you'll receive a reset link shortly.</div>
            <Link href="/login" className="button button--outline auth-submit">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <p className="auth-hint">Enter your email and we'll send you a reset link.</p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" className="button button--dark auth-submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="auth-footer-link">
              <Link href="/login" className="auth-link">Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
