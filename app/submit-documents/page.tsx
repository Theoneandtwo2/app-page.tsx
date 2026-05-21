"use client";

import { useState, useRef } from "react";

const DOC_FIELDS = [
  { key: "w9File", label: "W-9", description: "IRS Form W-9 (PDF or image)" },
  { key: "coiFile", label: "COI", description: "Certificate of Insurance (PDF)" },
  { key: "einFile", label: "EIN Letter", description: "EIN Confirmation Letter from IRS (PDF)" },
  { key: "licenseFile", label: "Business License", description: "State or local business license (PDF or image)" },
];

export default function SubmitDocumentsPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    // Build documentTypes string from which files were attached
    const docTypes: string[] = [];
    for (const { key, label } of DOC_FIELDS) {
      const file = data.get(key) as File | null;
      if (file && file.size > 0) docTypes.push(label);
    }
    if (docTypes.length === 0) {
      setError("Please attach at least one document.");
      setStatus("idle");
      return;
    }
    data.set("documentTypes", docTypes.join(", "));

    try {
      const res = await fetch("/api/documents", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      setTrackingUrl(json.trackingUrl);
      setStatus("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  function copyLink() {
    const full = `${window.location.origin}${trackingUrl}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Documents Received</h1>
          <p className="text-gray-600 mb-6">
            Thank you! Gol Homes has received your supporting documents.
            Use the link below to track review status.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Save Your Tracking Link</p>
            <p className="text-xs text-yellow-700 break-all">
              {typeof window !== "undefined" ? `${window.location.origin}${trackingUrl}` : trackingUrl}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            {copied ? "Copied!" : "Copy Tracking Link"}
          </button>
          <a
            href={trackingUrl}
            className="block mt-3 text-sm text-blue-600 underline"
          >
            View Status Now
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Submit Supporting Documents</h1>
        <p className="text-gray-500 text-sm mb-6">
          Upload your W-9, COI, EIN letter, and/or business license. No account required.
        </p>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              name="companyName"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC Contracting LLC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input
              name="contactName"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              name="submitterEmail"
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@company.com"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Attach Documents (attach at least one)</p>
            <div className="space-y-3">
              {DOC_FIELDS.map(({ key, label, description }) => (
                <div key={key} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <p className="text-xs text-gray-400 mb-1">{description}</p>
                    <input
                      name={key}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs file:font-medium hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
          >
            {status === "submitting" ? "Submitting..." : "Submit Documents"}
          </button>
        </form>
      </div>
    </main>
  );
}
