"use client";

import { useState } from "react";

export default function ViewFileButton({
  invoiceId,
  fileName,
}: {
  invoiceId: string;
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openFile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/file`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not load file.");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={openFile}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gol-green text-gol-green text-xs font-semibold hover:bg-gol-green-light transition-colors disabled:opacity-60 focus-ring"
      >
        {loading ? "Loading…" : "📄 View File"}
      </button>
      {fileName && (
        <div className="text-[11px] text-gol-muted mt-1 truncate max-w-[200px]">
          {fileName}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
