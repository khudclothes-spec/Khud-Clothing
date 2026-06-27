"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <div className="newsletter-success">
        <div className="newsletter-success__title">You are on the list.</div>
        <div className="newsletter-success__body">We will be in touch before the drop goes live.</div>
      </div>
    );
  }

  return (
    <div>
      <form
        className="newsletter-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSubscribed(true);
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
        />
        <button type="submit">Join</button>
      </form>
      <div className="newsletter-note">Frontend demo, no email is stored.</div>
    </div>
  );
}
