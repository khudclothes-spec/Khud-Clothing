"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Account-based student verification. The code is sent to the customer's OWN
// registered email (not a typed one), so only the mailbox owner can verify and
// only accounts registered with a university email qualify. After verifying,
// they're told to use STUDENT10 at checkout.
export function StudentVerify() {
  const router = useRouter();
  const supabase = createClient();
  const [stage, setStage] = useState("start"); // start | token | done
  const [accountEmail, setAccountEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setAccountEmail(userData?.user?.email ?? "");
    })();
  }, [supabase]);

  async function requestCode() {
    setBusy(true); setError(""); setNote("");
    try {
      const res = await fetch("/api/student/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send a code.");
      setStage("token");
      setNote(`We've emailed a verification code to ${accountEmail}. Enter it below.`);
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
    return (
      <div className="account-note account-note--ok" style={{ marginBottom: 0 }}>
        You're verified! Use code <strong>STUDENT10</strong> at checkout to get your student discount.
      </div>
    );
  }

  return (
    <div className="student-verify">
      <div className="student-verify__title">Student verification</div>
      <p className="form-hint" style={{ marginBottom: 12 }}>
        We'll send a verification code to your account email
        {accountEmail ? <> (<strong>{accountEmail}</strong>)</> : ""}. Verify once to unlock student pricing.
      </p>
      {error && <div className="account-note account-note--err">{error}</div>}
      {note && <div className="account-note account-note--ok">{note}</div>}

      {stage === "start" ? (
        <button type="button" className="button button--dark" onClick={requestCode} disabled={busy}>
          {busy ? "Sending…" : "Send verification code to my email"}
        </button>
      ) : (
        <form onSubmit={verify} className="student-verify__row">
          <input className="form-input" placeholder="Enter code" value={token} onChange={(e) => setToken(e.target.value)} required style={{ textTransform: "uppercase" }} />
          <button type="submit" className="button button--dark" disabled={busy}>{busy ? "Verifying…" : "Verify"}</button>
        </form>
      )}
    </div>
  );
}
