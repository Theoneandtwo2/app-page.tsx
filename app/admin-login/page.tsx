"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendLoginLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSentTo(email);
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gol-border rounded-card shadow-card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-4">
              📧
            </div>
            <h1 className="text-xl font-bold text-gol-dark">Check your email</h1>
            <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
              A one-time login link has been sent to{" "}
              <strong className="text-gol-dark break-all">{sentTo}</strong>.
              Click the link in the email to access the admin dashboard.
            </p>

            <div className="mt-5 text-left rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-blue-800 mb-1">
                🔒 Security Note
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                The link expires after 1 hour. If you did not request this,
                you can safely ignore the email.
              </p>
            </div>

            <button
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="block mt-5 mx-auto text-xs text-gol-muted hover:text-gol-dark transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gol-border rounded-card shadow-card p-8">
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1.5">
            Gol Homes Admin Login
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
            Log in by email
          </h1>
          <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
            Enter the approved admin email and we&apos;ll send a one-time login
            link. No password required.
          </p>

          <form onSubmit={sendLoginLink} className="mt-6 space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gol-dark mb-1.5">
                Email address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gol-border rounded-xl text-sm text-gol-dark focus:outline-none focus:border-gol-green focus:ring-2 focus:ring-gol-green/15 transition-colors"
                placeholder="admin@golhomes.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gol-green text-white text-sm font-semibold hover:bg-gol-green-dark transition-colors disabled:opacity-60 focus-ring"
            >
              {loading ? "Sending..." : "Send login link"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-gol-muted hover:text-gol-dark transition-colors">
              ← Back to portal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
