import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BrandHeader from "@/components/BrandHeader";
import DetailRow from "@/components/DetailRow";
import { StatusHero } from "@/components/StatusBadge";

type PageProps = { params: Promise<{ trackingToken: string }> };

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env vars");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function formatMoney(v: string | number | null | undefined) {
  if (v == null) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? String(v) : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ProposalStatusPage({ params }: PageProps) {
  const { trackingToken } = await params;
  const supabase = createServiceClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      "company_name, proposal_category, project_address, price, option_price, soonest_start_date, duration, status, admin_notes, submitted_at, file_paths"
    )
    .eq("tracking_token", trackingToken)
    .single();

  if (error || !proposal) notFound();

  let files: { name: string }[] = [];
  try {
    const raw = proposal.file_paths;
    files = Array.isArray(raw) ? raw : JSON.parse(raw || "[]");
  } catch {
    files = [];
  }

  return (
    <main className="min-h-screen px-4 pt-10 pb-16 sm:pt-14">
      <div className="max-w-md mx-auto">
        <BrandHeader />

        <section className="bg-white border border-gol-border rounded-card shadow-card p-6 sm:p-8">
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
            Proposal Tracking
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark mb-2">Proposal Status</h1>
          <p className="text-sm text-gol-muted leading-relaxed mb-5">
            This private page shows the current review status for your submitted proposal.
          </p>

          <StatusHero status={proposal.status} />

          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2 mb-5">
            <DetailRow label="Company" value={proposal.company_name} />
            <DetailRow label="Category" value={proposal.proposal_category} />
            <DetailRow label="Project" value={proposal.project_address} />
            <DetailRow label="Price" value={formatMoney(proposal.price)} valueClassName="text-base font-bold" />
            {proposal.option_price != null && (
              <DetailRow label="Option Price" value={formatMoney(proposal.option_price)} />
            )}
            {proposal.soonest_start_date && (
              <DetailRow label="Start Date" value={formatDate(proposal.soonest_start_date)} />
            )}
            {proposal.duration && (
              <DetailRow label="Duration" value={proposal.duration} />
            )}
            <DetailRow label="Submitted" value={formatDate(proposal.submitted_at)} isLast />
          </div>

          {proposal.admin_notes && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5">
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-blue-800 mb-1">
                📝 Notes from Gol Homes
              </div>
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">
                {proposal.admin_notes}
              </p>
            </div>
          )}

          {files.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mb-5">
              <p className="text-2xs font-bold tracking-eyebrow uppercase text-gol-muted mb-2">
                Submitted Files
              </p>
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="text-sm text-gol-dark flex items-center gap-2">
                    <span className="text-gray-300">•</span>
                    <span className="text-gol-muted">{f.name || `File ${i + 1}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gol-muted leading-relaxed mb-5">
            Keep this link for your records. You will also receive an email
            notification when the status changes.
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gol-green text-white text-xs font-semibold hover:bg-gol-green-dark transition-colors focus-ring"
          >
            Back to portal
          </Link>
        </section>
      </div>
    </main>
  );
}
