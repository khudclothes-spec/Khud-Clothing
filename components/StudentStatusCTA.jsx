"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// Prompts shoppers to verify their student status (→ /account, which auth-gates
// itself and bounces guests through login and back). Once verified, it shows a
// "Verified student" badge instead. Used on the home page and in the cart.
//   variant: "band" (full-width home section) | "cart" (compact drawer strip)
//   onNavigate: optional callback fired on click (e.g. close the cart drawer)
export function StudentStatusCTA({ variant = "band", onNavigate }) {
  // loading → render nothing (avoids a flash + SSR/client mismatch)
  const [status, setStatus] = useState("loading"); // loading | guest | unverified | verified

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setStatus("guest"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("student_verified")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setStatus(profile?.student_verified ? "verified" : "unverified");
    }

    load();
    // Re-check when auth changes (sign in/out) so the badge stays accurate.
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (status === "loading") return null;

  if (status === "verified") {
    return (
      <div className={`student-cta student-cta--verified student-cta--${variant}`}>
        <span className="student-cta__badge">✓ Verified student</span>
        <span className="student-cta__copy">
          Use code <strong>STUDENT10</strong> at checkout for <strong>10% off</strong>.
        </span>
      </div>
    );
  }

  return (
    <div className={`student-cta student-cta--${variant}`}>
      <div className="student-cta__copy">
        <strong>Students get 10% off.</strong> Verify your student status to unlock student pricing.
      </div>
      <Link href="/account" onClick={onNavigate} className="button button--dark button--sm student-cta__btn">
        Verify student status
      </Link>
    </div>
  );
}
