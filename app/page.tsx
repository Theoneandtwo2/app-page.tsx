import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-start justify-center px-4 pt-12 pb-16 sm:pt-16">
      <div className="w-full max-w-3xl">
        <BrandHeader />

        <section className="bg-white border border-gol-border rounded-card shadow-card p-8 sm:p-10">
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1.5">
            Welcome
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gol-dark">
            Subcontractor Portal
          </h1>
          <p className="mt-3 text-sm sm:text-[15px] text-gol-muted leading-relaxed max-w-2xl">
            Submit invoices, supporting documents, and proposals securely. After
            you submit, you&apos;ll receive a private tracking link by email so
            you can check the review status at any time. Gol Homes reviews all
            submissions through a protected admin dashboard.
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PortalCard
              href="/invoices/new"
              icon="📄"
              title="Submit Invoice"
              description="Upload your invoice and receive a private tracking link for payment status."
            />
            <PortalCard
              href="/submit-documents"
              icon="📁"
              title="Submit Documents"
              description="Upload W-9, COI, EIN letter, or business license for compliance review."
            />
            <PortalCard
              href="/submit-proposal"
              icon="📋"
              title="Submit Proposal"
              description="Submit a project proposal with pricing, timeline, and supporting files."
            />
          </div>

          <div className="mt-7 pt-5 border-t border-gray-100">
            <p className="text-xs text-gol-muted">
              No account or login required for subcontractors.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function PortalCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-card-sm border border-gol-border p-5 sm:p-6 hover:border-emerald-200 hover:shadow-card-hover transition-all focus-ring"
    >
      <div className="text-2xl mb-3" aria-hidden>
        {icon}
      </div>
      <div className="text-[15px] font-bold text-gol-dark mb-1.5">{title}</div>
      <p className="text-xs text-gol-muted leading-relaxed">{description}</p>
      <div className="mt-4 text-xs font-semibold text-gol-green group-hover:text-gol-green-dark transition-colors">
        {title} →
      </div>
    </Link>
  );
}
