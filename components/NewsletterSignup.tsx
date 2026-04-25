"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
        setEmail("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-8 text-center">
        <p className="text-lg font-bold text-white">Check your inbox.</p>
        <p className="mt-1 text-sm text-zinc-400">
          You're now subscribed to The Fearless newsletter.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-8">
      <h2 className="text-2xl font-extrabold tracking-tight text-white">
        Stay fearless.
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Smart contract security, audits, and Web3 insights — straight to your
        inbox.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-10 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
