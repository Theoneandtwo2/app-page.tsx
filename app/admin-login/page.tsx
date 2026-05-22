"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendLoginLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="max-w-xl w-full bg-white border rounded-2xl shadow-sm p-8">
        <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
          Gol Homes Admin Login
        </p>

        <h1 className="text-3xl font-bold mt-3">Log in by email</h1>

        <p className="text-gray-600 mt-3">
          Enter the approved admin email and we&apos;ll send a one-time login link.
        </p>

        <form onSubmit={sendLoginLink} className="mt-6">
          <label className="block text-sm font-medium">Email address</label>

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border rounded-lg px-3 py-2"
            placeholder="admin@example.com"
          />

          {sent && (
            <p className="text-green-700 mt-4">
              Check your email for the login link.
            </p>
          )}

          <button
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gol-green text-white py-2 px-4 font-semibold"
          >
            {loading ? "Sending..." : "Send login link"}
          </button>
        </form>
      </section>
    </main>
  );
}
