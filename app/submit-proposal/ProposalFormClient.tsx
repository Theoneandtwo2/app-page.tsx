"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ConfirmationCard from "@/components/ConfirmationCard";

const MAX_FILES = 5;

export default function ProposalFormClient({
  projects,
  categories,
}: {
  projects: string[];
  categories: string[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fileCount, setFileCount] = useState(0);
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

    const files = fd.getAll("proposalFiles").filter((x) => x instanceof File && (x as File).size > 0);
    if (files.length === 0) {
      setError("Please attach at least one proposal file.");
      setSubmitting(false);
      return;
    }
    if (files.length > MAX_FILES) {
      setError(`Please attach no more than ${MAX_FILES} files.`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/proposals", { method: "POST", body: fd });
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
        title="Proposal Submitted!"
        submissionLabel="proposal"
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
            Proposal Submission
          </div>
          <h1 className="text-2xl font-bold text-gol-dark mb-2">Submit Proposal</h1>
          <p className="text-sm text-gol-muted leading-relaxed mb-7">
            Submit your project proposal securely. After submission, you will
            receive a private tracking link by email. No account required.
          </p>

          <div className="space-y-5">
            <Field label="Email Address" required hint="Your tracking link will be sent here.">
              <input name="submitterEmail" type="email" required placeholder="you@example.com" className="form-input" />
            </Field>
            <Field label="Company Name" required>
              <input name="companyName" type="text" required className="form-input" placeholder="Test Contracting Co" />
            </Field>
            <Field label="Contact Name">
              <input name="contactName" type="text" className="form-input" placeholder="(optional)" />
            </Field>

            <Field label="Proposal Category" required>
              <select name="proposalCategory" required defaultValue="" className="form-input">
                <option value="" disabled>Select category</option>
                {categories.map((c) => (<option key={c}>{c}</option>))}
              </select>
            </Field>

            <Field label="Project Address" required>
              <select name="projectAddress" required defaultValue="" className="form-input">
                <option value="" disabled>Select project</option>
                {projects.map((p) => (<option key={p}>{p}</option>))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Price" required>
                <input name="price" type="number" step="0.01" min="0" required placeholder="0.00" className="form-input" />
              </Field>
              <Field label="Option Price" hint="Price for any additional work out of original Scope of Work">
                <input name="optionPrice" type="number" step="0.01" min="0" placeholder="0.00" className="form-input" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Soonest Start Date">
                <input name="soonestStartDate" type="date" className="form-input" />
              </Field>
              <Field label="Duration">
                <input name="duration" type="text" placeholder="e.g. 3 weeks" className="form-input" />
              </Field>
            </div>

            <Field label="Proposal Attachments" required hint={`Up to ${MAX_FILES} files. PDF or images.`}>
              <input
                name="proposalFiles"
                type="file"
                accept=".pdf,image/*"
                multiple
                required
                onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
                className="block w-full text-sm text-gray-700 border border-gol-border rounded-xl px-3.5 py-2.5 bg-white"
              />
              {fileCount > 0 && (
                <p className="mt-1 text-[11px] text-gol-muted">
                  📎 {fileCount} file{fileCount === 1 ? "" : "s"} selected
                </p>
              )}
            </Field>
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
            {submitting ? "Submitting..." : "Submit Proposal"}
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
