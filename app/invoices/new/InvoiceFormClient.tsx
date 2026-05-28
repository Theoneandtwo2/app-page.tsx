"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConfirmationCard from "@/components/ConfirmationCard";

export default function InvoiceFormClient({ projects }: { projects: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    trackingUrl: string;
    statusPath: string;
    submitterEmail: string;
  } | null>(null);

  async function submitInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const submitterEmail = String(formData.get("submitterEmail") || "");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Invoice submission failed.");

      const statusPath: string = data?.trackingUrl || "/";
      const fullUrl = window.location.origin + statusPath;
      setSuccess({ trackingUrl: fullUrl, statusPath, submitterEmail });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <ConfirmationCard
        title="Invoice Submitted!"
        submissionLabel="invoice"
        submitterEmail={success.submitterEmail}
        trackingUrl={success.trackingUrl}
        statusHref={success.statusPath}
      />
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gol-dark flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/gol-logo.png" alt="GOL" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green">
              Gol Homes Development LLC
            </div>
            <Link href="/" className="block text-[11px] text-gol-muted hover:text-gol-dark mt-0.5 transition-colors">
              ← Back to portal
            </Link>
          </div>
        </div>

        <form
          onSubmit={submitInvoice}
          className="bg-white border border-gol-border rounded-card shadow-card p-6 sm:p-8"
        >
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
            Invoice Submission
          </div>
          <h1 className="text-2xl font-bold text-gol-dark mb-2">Submit Invoice</h1>
          <p className="text-sm text-gol-muted leading-relaxed mb-7">
            Submit your invoice securely. After submission, you will receive a
            private tracking link by email. No account required.
          </p>

          <div className="space-y-5">
            <Field label="Project" required>
              <select name="projectName" required defaultValue="" className="form-input">
                <option value="" disabled>Choose project</option>
                {projects.map((p) => (<option key={p}>{p}</option>))}
              </select>
            </Field>

            <Field label="Email Address" required hint="Your tracking link will be sent here.">
              <input name="submitterEmail" type="email" required placeholder="you@example.com" className="form-input" />
            </Field>

            <Field label="Company Name" required>
              <input name="companyName" type="text" required className="form-input" />
            </Field>

            <Field label="Your Name" required>
              <input name="contactName" type="text" required className="form-input" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Invoice Amount" required>
                <input name="invoiceAmount" type="number" step="0.01" min="0" required placeholder="0.00" className="form-input" />
              </Field>
              <Field label="Invoice Number">
                <input name="invoiceNumber" type="text" className="form-input" placeholder="(optional)" />
              </Field>
            </div>

            <Field label="Invoice Date" required>
              <input name="invoiceDate" type="date" required className="form-input" />
            </Field>

            <Field label="Invoice Attachment" required hint="PDF or image accepted.">
              <input
                name="invoiceFile"
                type="file"
                accept=".pdf,image/*"
                required
                className="block w-full text-sm text-gray-700 border border-gol-border rounded-xl px-3.5 py-2.5 bg-white"
              />
            </Field>

            <label className="flex items-start gap-3 cursor-pointer">
              <input name="lienWaiverAccepted" type="checkbox" required className="mt-1 w-4 h-4 accent-[#1a6b47]" />
              <span className="text-sm text-gray-700 leading-relaxed">
                I waive all lien rights for this invoice amount and any prior payments received.
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gol-green text-white text-sm font-semibold hover:bg-gol-green-dark transition-colors disabled:opacity-60 focus-ring"
          >
            {submitting ? "Submitting..." : "Submit Invoice"}
          </button>
        </form>
      </div>
</main>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gol-dark mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gol-muted">{hint}</p>}
    </div>
  );
}
