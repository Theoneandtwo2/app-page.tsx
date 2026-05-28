"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConfirmationCard from "@/components/ConfirmationCard";

const DOC_FIELDS = [
  { key: "w9File", label: "W-9", required: true, description: "IRS Form W-9 (PDF or image)" },
  { key: "coiFile", label: "COI", required: true, description: "Certificate of Insurance" },
  { key: "einFile", label: "EIN Letter", required: false, description: "IRS EIN confirmation letter" },
  { key: "licenseFile", label: "Business License", required: false, description: "State or local business license" },
];

export default function SubmitDocumentsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    trackingUrl: string;
    statusPath: string;
    submitterEmail: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const submitterEmail = String(fd.get("submitterEmail") || "");

    const types: string[] = [];
    for (const { key, label } of DOC_FIELDS) {
      const f = fd.get(key);
      if (f instanceof File && f.size > 0) types.push(label);
    }
    if (types.length === 0) {
      setError("Please attach at least one document.");
      setSubmitting(false);
      return;
    }
    fd.set("documentTypes", types.join(", "));

    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Submission failed");

      const statusPath: string = data?.trackingUrl || "/";
      setSuccess({
        trackingUrl: window.location.origin + statusPath,
        statusPath,
        submitterEmail,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <ConfirmationCard
        title="Documents Submitted!"
        submissionLabel="documents"
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

        <form onSubmit={handleSubmit} className="bg-white border border-gol-border rounded-card shadow-card p-6 sm:p-8">
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
            Supporting Documents
          </div>
          <h1 className="text-2xl font-bold text-gol-dark mb-2">Submit Documents</h1>
          <p className="text-sm text-gol-muted leading-relaxed mb-7">
            Upload your compliance documents securely. After submission, you
            will receive a private tracking link by email. No account required.
          </p>

          <div className="space-y-5">
            <Field label="Email Address" required hint="Your tracking link will be sent here.">
              <input name="submitterEmail" type="email" required placeholder="you@example.com" className="form-input" />
            </Field>
            <Field label="Company Name" required>
              <input name="companyName" type="text" required className="form-input" placeholder="ABC Contracting LLC" />
            </Field>
            <Field label="Contact Name" required>
              <input name="contactName" type="text" required className="form-input" placeholder="John Smith" />
            </Field>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gol-dark mb-3">
                Attach Documents
                <span className="ml-1 font-normal text-gol-muted text-[12px]">
                  (W-9 and COI are required; others are optional)
                </span>
              </p>
              <div className="space-y-3">
                {DOC_FIELDS.map(({ key, label, description, required }) => (
                  <div key={key} className="rounded-2xl border border-gol-border bg-gol-soft/40 p-3.5">
                    <label className="block text-[13px] font-medium text-gol-dark">
                      {label}
                      {required ? (
                        <span className="text-red-500 ml-0.5">*</span>
                      ) : (
                        <span className="ml-1 font-normal text-gol-muted text-[11px]">(optional)</span>
                      )}
                    </label>
                    <p className="text-[11px] text-gol-muted mt-0.5 mb-1.5">{description}</p>
                    <input
                      name={key}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required={required}
                      className="block w-full text-sm text-gray-700 border border-gol-border rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
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
            {submitting ? "Submitting..." : "Submit Documents"}
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
