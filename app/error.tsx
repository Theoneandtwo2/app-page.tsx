"use client";

import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <BrandHeader />
        <section className="bg-white border border-gol-border rounded-card shadow-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
            Something went wrong
          </h1>
          <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
            An unexpected error occurred. Please try again. If the problem
            continues, please contact Gol Homes.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gol-green text-white text-sm font-semibold hover:bg-gol-green-dark transition-colors focus-ring"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gol-green text-gol-green text-sm font-semibold hover:bg-gol-green-light transition-colors focus-ring"
            >
              Back to portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
