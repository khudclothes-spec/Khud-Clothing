"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Account-based student verification (never promo-code based). Enter a
// university email → receive a code → enter it here → student_verified flips.
export function StudentVerify() {
  const router = useRouter();
  const supabase = createClient();
  const [stage, setStage] = useState("email"); // email | token | done
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [domains, setDomains] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("student_email_domains").select("domain").eq("is_active", true);
      setDomains((data ?? []).map((d) => d.domain));
    })();
  }, [supabase]);

  async function requestCode(e) {
    e.preventDefault();
    setBusy(true); setError(""); setNote("");
    try {
      const res = await fetch("/api/student/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send a code.");
      setStage("token");
      setNote("We've emailed a verification code. Enter it below.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { data, error: rpcErr } = await supabase.rpc("verify_student_token", { p_token: token.trim().toUpperCase() });
      if (rpcErr) throw new Error(rpcErr.message);
      if (!data?.ok) {
        const map = {
          INVALID_TOKEN: "That code isn't valid.",
          ALREADY_USED: "That code has already been used.",
          EXPIRED: "That code has expired — request a new one.",
          NOT_AUTHENTICATED: "Please sign in again."
        };
        throw new Error(map[data?.error] || "Verification failed.");
      }
      setStage("done");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (stage === "done") {
    return <div className="account-note account-note--ok" style={{ marginBottom: 0 }}>You're verified — student pricing is now unlocked.</div>;
  }

  return (
    <div className="student-verify">
      <div className="student-verify__title">Student verification</div>
      <p className="form-hint" style={{ marginBottom: 12 }}>
        Verify once with your university email to unlock student-only discounts.
        {domains.length > 0 && <> Approved domains: {domains.join(", ")}.</>}
      </p>
      {error && <div className="account-note account-note--err">{error}</div>}
      {note && <div className="account-note account-note--ok">{note}</div>}

      {stage === "email" ? (
        <form onSubmit={requestCode} className="student-verify__row">
          <input type="email" className="form-input" placeholder="you@university.edu.pk" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" className="button button--dark" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="student-verify__row">
          <input className="form-input" placeholder="Enter code" value={token} onChange={(e) => setToken(e.target.value)} required style={{ textTransform: "uppercase" }} />
          <button type="submit" className="button button--dark" disabled={busy}>{busy ? "Verifying…" : "Verify"}</button>
        </form>
      )}
    </div>
  );
}
