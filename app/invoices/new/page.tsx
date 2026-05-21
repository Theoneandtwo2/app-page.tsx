"use client";
import { useState } from "react";

const projects = ["2757 Nelson", "2767 Nelson", "6004 Balsam", "5914 Woodley"];

export default function NewInvoicePage() {
  const [submitting, setSubmitting] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submitInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/invoices", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);
    setSubmitting(false);

    if (!response.ok) {
      alert(data?.error || "Invoice submission failed.");
      return;
    }

    if (data?.trackingUrl) {
      const fullUrl = window.location.origin + data.trackingUrl;
      setTrackingUrl(fullUrl);
      return;
    }

    alert("Invoice submitted for pending review.");
    form.reset();
  }

  function copyLink() {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (trackingUrl) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border rounded-2xl p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Submitted!</h1>
          <p className="text-gray-600 mt-3">
            Your invoice has been received and is pending review. Use the link
            below to check your invoice status at any time.
          </p>
          <p className="text-sm font-semibold text-red-600 mt-4">
            ⚠️ Save this link — it is the only way to check your invoice status.
          </p>
          <div className="mt-4 bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-700 break-all">
            {trackingUrl}
          </div>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={copyLink}
              className="bg-gol-green text-white font-semibold py-2 px-5 rounded-lg hover:opacity-90 transition"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={trackingUrl}
              className="border border-gol-green text-gol-green font-semibold py-2 px-5 rounded-lg hover:bg-green-50 transition"
            >
              View Status
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <form
        onSubmit={submitInvoice}
        className="max-w-2xl mx-auto bg-white border rounded-2xl p-8 shadow-sm"
      >
        <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
          Gol Homes Development LLC
        </p>
        <h1 className="text-2xl font-bold mt-2">Submit Invoice</h1>
        <p className="text-gray-600 mt-2">
          Submit your invoice securely. After submission, you will receive a
          private tracking link. Please save it — no account or email required.
        </p>
        <label className="block mt-5 text-sm font-medium">Project</label>
        <select
          name="projectName"
          required
          className="mt-2 w-full border rounded-lg px-3 py-2"
        >
          <option value="">Choose project</option>
          {projects.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <label className="block mt-4 text-sm font-medium">Email</label>
        <input
          name="submitterEmail"
          required
          type="email"
          className="mt-2 w-full border rounded-lg px-3 py-2"
          placeholder="you@example.com"
        />
        <label className="block mt-4 text-sm font-medium">Company Name</label>
        <input
          name="companyName"
          required
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="block mt-4 text-sm font-medium">Your Name</label>
        <input
          name="contactName"
          required
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="block mt-4 text-sm font-medium">Invoice Amount</label>
        <input
          name="invoiceAmount"
          required
          type="number"
          step="0.01"
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="block mt-4 text-sm font-medium">Invoice Number</label>
        <input
          name="invoiceNumber"
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="block mt-4 text-sm font-medium">Invoice Date</label>
        <input
          name="invoiceDate"
          required
          type="date"
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="block mt-4 text-sm font-medium">
          Invoice Attachment
        </label>
        <input
          name="invoiceFile"
          required
          type="file"
          accept=".pdf,image/*"
          className="mt-2 w-full border rounded-lg px-3 py-2"
        />
        <label className="flex gap-3 mt-5 text-sm">
          <input name="lienWaiverAccepted" required type="checkbox" />
          <span>
            I waive all lien rights for this invoice amount and any prior
            payments received.
          </span>
        </label>
        <button
          disabled={submitting}
          className="mt-6 rounded-lg bg-gol-green text-white py-2 px-4 font-semibold"
        >
          {submitting ? "Submitting..." : "Submit Invoice"}
        </button>
      </form>
    </main>
  );
}
