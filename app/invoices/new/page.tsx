"use client";

import { useState } from "react";

const projects = ["2757 Nelson", "2767 Nelson", "6004 Balsam", "5914 Woodley"];

export default function NewInvoicePage() {
  const [submitting, setSubmitting] = useState(false);

  async function submitInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const response = await fetch("/api/invoices", {
      method: "POST",
      body: formData,
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || "Invoice submission failed.");
      return;
    }

    alert(
      "Invoice submitted for pending review. A private tracking link will be available for this invoice."
    );

    e.currentTarget.reset();
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
          Submit your invoice securely. Gol Homes will review it and update the
          invoice status after review.
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
