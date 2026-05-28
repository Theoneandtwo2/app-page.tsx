import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import DetailRow from "@/components/DetailRow";
import ProposalStatusActions from "./ProposalStatusActions";
import ProposalFileButton from "./ProposalFileButton";

type PageProps = { params: Promise<{ id: string }> };

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env vars");
  return createSupabaseServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

export default async function ProposalReviewPage({ params }: PageProps) {
  const { id } = await params;

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) redirect("/admin-login");

  const service = createServiceClient();
  const { data: proposal, error } = await service
    .from("proposals")
    .select(
      "id, submitter_email, company_name, contact_name, proposal_category, project_address, price, option_price, soonest_start_date, duration, file_paths, status, admin_notes, submitted_at, tracking_token"
    )
    .eq("id", id)
    .single();

  if (error || !proposal) notFound();

  let files: { path: string; name: string; size?: number }[] = [];
  try {
    files = Array.isArray(proposal.file_paths)
      ? proposal.file_paths
      : JSON.parse(proposal.file_paths || "[]");
  } catch {
    files = [];
  }

  const base = Number(proposal.price) || 0;
  const opt = Number(proposal.option_price) || 0;
  const total = base + opt;

  return (
    <div className="min-h-screen">
      <AdminNav email={user.email!} backToDashboard />

      <main className="px-4 sm:px-6 py-7 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
                Proposal Review
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
                {proposal.company_name}
              </h1>
              <p className="text-sm text-gol-muted mt-1">
                {proposal.proposal_category} · {proposal.project_address} ·
                Submitted {formatDate(proposal.submitted_at)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={proposal.status} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Proposal Details</h2>
                <DetailRow label="Company" value={proposal.company_name} />
                {proposal.contact_name && (<DetailRow label="Contact" value={proposal.contact_name} />)}
                <DetailRow label="Email" value={proposal.submitter_email} />
                <DetailRow label="Category" value={proposal.proposal_category} />
                <DetailRow label="Project" value={proposal.project_address} />
                <DetailRow
                  label="Price"
                  value={formatMoney(proposal.price)}
                  valueClassName="text-base font-bold"
                />
                <DetailRow label="Option Price" value={formatMoney(proposal.option_price)} />
                <DetailRow label="Start Date" value={formatDate(proposal.soonest_start_date)} />
                <DetailRow label="Duration" value={proposal.duration || "—"} />
                <DetailRow label="Submitted" value={formatDate(proposal.submitted_at)} isLast />
              </section>

              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">
                  Attached Files
                  <span className="ml-2 text-xs font-normal text-gol-muted">({files.length})</span>
                </h2>
                {files.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <div className="text-sm font-semibold text-gol-dark">
                            {f.name || `File ${i + 1}`}
                          </div>
                          {f.size != null && (
                            <div className="text-xs text-gol-muted mt-0.5">
                              {(f.size / 1024).toFixed(0)} KB
                            </div>
                          )}
                        </div>
                        <ProposalFileButton proposalId={id} index={i} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gol-muted">No files attached.</p>
                )}

                {proposal.tracking_token && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gol-muted mb-1">Subcontractor tracking link:</p>
                    <Link
                      href={`/proposal-status/${proposal.tracking_token}`}
                      className="text-xs font-semibold text-gol-green hover:text-gol-green-dark break-all"
                    >
                      /proposal-status/{proposal.tracking_token}
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <ProposalStatusActions
                proposalId={id}
                currentStatus={proposal.status}
                currentNotes={proposal.admin_notes || ""}
              />

              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Price Summary</h2>
                <DetailRow label="Base Price" value={formatMoney(proposal.price)} valueClassName="font-bold" />
                <DetailRow label="Option Price" value={formatMoney(proposal.option_price)} isLast />
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gol-dark">
                    Total (if option included)
                  </span>
                  <span className="text-lg font-bold text-gol-green">
                    {formatMoney(total)}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
