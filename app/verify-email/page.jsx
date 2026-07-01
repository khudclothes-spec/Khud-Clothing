"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Check } from "@/components/Icons";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const supabaseRef = useRef(null);

  // Watch for verification: same-browser confirmation clicks fire
  // onAuthStateChange; a poll covers the session appearing any other way.
  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") || "");

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      setVerified(true);
      setTimeout(() => router.push("/"), 1400);
    }

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) finish();
    }

    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) finish();
    });
    const interval = setInterval(check, 4000);

    return () => {
      clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setResent(false);
    const { error: err } = await supabaseRef.current.auth.resend({ type: "signup", email });
    setResending(false);
    if (err) {
      setError(err.message || "Could not resend. Please try again shortly.");
    } else {
      setResent(true);
      setCooldown(30);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/images/logo-black-writing.png" alt="Khud" className="auth-logo" />
        </div>

        {verified ? (
          <div className="verify-state verify-state--done">
            <div className="verify-icon verify-icon--ok"><Check size={24} /></div>
            <h1 className="verify-title">Email verified</h1>
            <p className="verify-copy">You're all set. Taking you in…</p>
          </div>
        ) : (
          <div className="verify-state">
            <div className="verify-icon"><MailIcon /></div>
            <h1 className="verify-title">Verify your email</h1>
            <p className="verify-copy">We've sent a verification email{email ? <> to <strong>{email}</strong></> : ""}.</p>
            <p className="verify-copy">Please check your inbox and click the link to activate your account. This page will continue automatically once you're verified.</p>

            {error && <div className="auth-error" style={{ marginTop: 4 }}>{error}</div>}
            {resent && !error && <div className="verify-note verify-note--ok">Verification email sent again. Check your inbox (and spam).</div>}

            <div className="verify-resend">
              <span>Didn't receive it?</span>
              <button
                type="button"
                className="button button--outline"
                onClick={handleResend}
                disabled={resending || cooldown > 0 || !email}
              >
                {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </button>
            </div>

            <div className="verify-foot">
              <Link href="/login" className="auth-link">Back to sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
