"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const WARN_MS = 30 * 60 * 1000;   // 30 minutes
const LOGOUT_MS = 32 * 60 * 1000; // 32 minutes

export function SessionMonitor() {
  const router = useRouter();
  const supabase = createClient();
  const [active, setActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const warnRef = useRef(null);
  const logoutRef = useRef(null);

  const clearTimers = () => {
    clearTimeout(warnRef.current);
    clearTimeout(logoutRef.current);
  };

  const scheduleTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    warnRef.current = setTimeout(() => setShowWarning(true), WARN_MS);
    logoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, LOGOUT_MS);
  }, []);

  const keepAlive = useCallback(() => {
    if (active) scheduleTimers();
  }, [active, scheduleTimers]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setActive(true);
        scheduleTimers();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setActive(true);
        scheduleTimers();
      } else {
        setActive(false);
        clearTimers();
        setShowWarning(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, keepAlive, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, keepAlive));
  }, [active, keepAlive]);

  if (!showWarning) return null;

  return (
    <div className="session-overlay">
      <div className="session-modal">
        <div className="session-modal__title">Session expiring</div>
        <p className="session-modal__body">
          You've been inactive for 30 minutes. You'll be signed out in 2 minutes.
        </p>
        <button
          type="button"
          className="button button--dark"
          onClick={scheduleTimers}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
