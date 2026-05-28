"use client";

import { useState } from "react";
import Link from "next/link";
import BrandHeader from "./BrandHeader";

type ConfirmationCardProps = {
  title: string;
  submissionLabel: string;
  submitterEmail: string;
  trackingUrl: string;
  statusHref: string;
};

export default function ConfirmationCard({
  title,
  submissionLabel,
  submitterEmail,
  trackingUrl,
  statusHref,
}: ConfirmationCardProps) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <BrandHeader />

        <div className="bg-white border border-gol-border rounded-card shadow-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mx-auto mb-4">
            ✅
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
            {title}
          </h1>
          <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
            Submission received. Your {submissionLabel} is{" "}
            <strong className="text-gol-dark">pending review</strong> by Gol Homes.
          </p>

          <div className="mt-5 text-left rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-emerald-800 mb-1">
              📧 Please check your email
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed">
              A status link has been sent to{" "}
              <strong className="break-all">{submitterEmail}</strong>. Check
              your inbox (and spam folder).
            </p>
          </div>

          <div className="mt-3 text-left rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-amber-800 mb-1">
              🔗 Backup tracking link
            </div>
            <p className="text-xs text-amber-900 mb-2">
              If you do not receive the email, save this backup link:
            </p>
            <div className="rounded-lg bg-white border border-amber-200 px-3 py-2 font-mono text-[11px] text-gray-700 break-all">
              {trackingUrl}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <button
              onClick={copyLink}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gol-green text-white text-xs font-semibold hover:bg-gol-green-dark transition-colors focus-ring"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <Link
              href={statusHref}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gol-green text-gol-green text-xs font-semibold hover:bg-gol-green-light transition-colors focus-ring"
            >
              View Status
            </Link>
          </div>

          <Link
            href="/"
            className="block mt-5 text-xs text-gol-muted hover:text-gol-dark transition-colors"
          >
            ← Back to portal
          </Link>
        </div>
      </div>
    </main>
  );
}
