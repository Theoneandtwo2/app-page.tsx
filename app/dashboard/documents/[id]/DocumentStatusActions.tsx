"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  docId: string;
  currentStatus: string;
  currentNotes: string;
};

const ACTIONS = [
  { key: "approved", label: "✅ Approve Documents", cls: "bg-gol-green hover:bg-gol-green-dark text-white" },
  { key: "missing_info", label: "⚠️ Request Info / Resubmit", cls: "bg-orange-600 hover:bg-orange-700 text-white" },
  { key: "rejected", label: "✗ Reject", cls: "bg-red-600 hover:bg-red-700 text-white" },
];

export default function DocumentStatusActions({ docId, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentNotes);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patch(status: string) {
    const res = await fetch(`/api/documents/${docId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_notes: notes }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Update failed");
  }

  async function updateStatus(status: string) {
    setError("");
    setPendingKey(status);
    try {
      await patch(status);
      setSavedAt(`Status updated to ${status} (emailed to subcontractor).`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingKey(null);
    }
  }

  async function saveNotesOnly() {
    setError("");
    setSavingNotes(true);
    try {
      await patch(currentStatus);
      setSavedAt("Notes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
      <h2 className="text-base font-semibold text-gol-dark">Update Status</h2>
      <p className="text-sm text-gol-muted mt-1.5 leading-relaxed mb-5">
        Change the review status. The subcontractor will be notified by email.
      </p>

      <div className="flex flex-col gap-2.5 mb-5">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => updateStatus(a.key)}
            disabled={pendingKey !== null || savingNotes}
            className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 focus-ring ${a.cls}`}
          >
            {pendingKey === a.key ? "Updating..." : a.label}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <label className="block text-[13px] font-medium text-gol-dark mb-1.5">
          Admin Notes <span className="font-normal text-gol-muted text-[11px]">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add a note for the subcontractor..."
          className="w-full px-3.5 py-2.5 border border-gol-border rounded-xl text-sm text-gol-dark focus:outline-none focus:border-gol-green focus:ring-2 focus:ring-gol-green/15 transition-colors resize-y"
        />
        <button
          onClick={saveNotesOnly}
          disabled={savingNotes || pendingKey !== null}
          className="mt-2.5 w-full inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gol-green text-gol-green text-xs font-semibold hover:bg-gol-green-light transition-colors disabled:opacity-60 focus-ring"
        >
          {savingNotes ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {savedAt && (
        <p className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {savedAt}
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}
