"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DocRecord = {
  id: string;
  company_name: string;
  contact_name: string;
  submitter_email: string;
  document_types: string;
  file_paths: string;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
};

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "missing_info", label: "Missing Info Needed" },
];

const FILE_LABELS: Record<string, string> = {
  w9File: "W-9",
  coiFile: "COI",
  einFile: "EIN Letter",
  licenseFile: "Business License",
};

export default function AdminDocumentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [doc, setDoc] = useState<DocRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.document) {
          setDoc(data.document);
          setStatus(data.document.status);
          setNotes(data.document.admin_notes || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/documents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  const fileList: { field: string; name: string; path: string }[] = (() => {
    try { return JSON.parse(doc?.file_paths || "[]"); }
    catch { return []; }
  })();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Document not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Document Review</h1>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Company</span>
              <span className="font-medium">{doc.company_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Contact</span>
              <span className="font-medium">{doc.contact_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{doc.submitter_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Documents</span>
              <span className="font-medium">{doc.document_types}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted</span>
              <span className="font-medium">{new Date(doc.uploaded_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {fileList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">Uploaded Files</h2>
            <ul className="space-y-2">
              {fileList.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{FILE_LABELS[f.field] ?? f.field}: <span className="text-gray-500 font-normal">{f.name}</span></span>
                  <a
                    href={`/api/documents/${doc.id}/file?field=${f.field}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View File
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Update Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Admin Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Notes visible to subcontractor on tracking page..."
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {saved && <p className="text-green-600 text-sm">Status saved successfully.</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
