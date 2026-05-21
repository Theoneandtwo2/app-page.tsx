"use client";

import { useState } from "react";

export default function ViewFileButton({ invoiceId, fileName }: { invoiceId: string; fileName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openFile() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/file`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not load file.");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-3">
      <button
        onClick={openFile}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-gol-green text-gol-green font-semibold px-4 py-2 text-sm hover:bg-green-50 transition disabled:opacity-50"
      >
        {loading ? "Loading..." : `📄 View Invoice File${fileName ? ` — ${fileName}` : ""}`}
      </button>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
