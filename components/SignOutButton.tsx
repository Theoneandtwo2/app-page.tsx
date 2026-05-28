"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-gol-green text-gol-green text-xs font-semibold hover:bg-gol-green-light transition-colors disabled:opacity-60 focus-ring"
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
