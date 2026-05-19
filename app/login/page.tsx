"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
  const [email,setEmail]=useState(""); const [sent,setSent]=useState(false); const [error,setError]=useState("");
  async function sendLink(e: React.FormEvent){ e.preventDefault(); setError(""); const supabase=createClient(); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } }); if(error){setError(error.message);return;} setSent(true); }
  return (<main className="min-h-screen flex items-center justify-center p-6"><form onSubmit={sendLink} className="bg-white border rounded-2xl shadow-sm p-8 max-w-md w-full"><p className="text-sm uppercase tracking-wide text-gol-green font-semibold">Invitation-only direction</p><h1 className="text-2xl font-bold mt-2">Log in by email</h1><p className="text-gray-600 mt-2">Enter your email and we’ll send a one-time login link. No password required.</p><label className="block mt-6 text-sm font-medium">Email address</label><input className="mt-2 w-full rounded-lg border px-3 py-2" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="company@example.com" />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}{sent && <p className="mt-3 text-sm text-green-700">Check your email for the login link.</p>}<button className="w-full mt-6 rounded-lg bg-gol-green text-white py-2 font-semibold">Send login link</button></form></main>);
}
