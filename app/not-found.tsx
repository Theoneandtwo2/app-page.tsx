import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <BrandHeader />
        <section className="bg-white border border-gol-border rounded-card shadow-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gol-soft flex items-center justify-center text-2xl mx-auto mb-4">
            🔍
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
            The link may be incorrect or the submission may have been removed.
            If you were trying to check a submission status, please use the
            tracking link from the confirmation email.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gol-green text-white text-sm font-semibold hover:bg-gol-green-dark transition-colors focus-ring"
          >
            Back to portal
          </Link>
        </section>
      </div>
    </main>
  );
}
