import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import DetailRow from "@/components/DetailRow";
import ViewFileButton from "./ViewFileButton";
import InvoiceStatusActions from "./InvoiceStatusActions";

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

export default async function InvoiceReviewPage({ params }: PageProps) {
  const { id } = await params;

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) redirect("/admin-login");

  const service = createServiceClient();
  const { data: invoice, error } = await service
    .from("invoices")
    .select(
      "id, project_name, submitter_email, company_name, contact_name, invoice_amount, invoice_number, invoice_date, lien_waiver_accepted, file_path, original_file_name, invoice_status, tracking_token, submitted_at, admin_notes"
    )
    .eq("id", id)
    .single();

  if (error || !invoice) notFound();

  const submittedLabel = formatDate(invoice.submitted_at);

  return (
    <div className="min-h-screen">
      <AdminNav email={user.email!} backToDashboard />

      <main className="px-4 sm:px-6 py-7 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
                Invoice Review
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
                {invoice.invoice_number || "—"}
              </h1>
              <p className="text-sm text-gol-muted mt-1">
                {invoice.company_name} · {invoice.project_name} · Submitted {submittedLabel}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={invoice.invoice_status} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Invoice Details</h2>
                <DetailRow label="Company" value={invoice.company_name} />
                <DetailRow label="Contact" value={invoice.contact_name} />
                <DetailRow label="Email" value={invoice.submitter_email} />
                <DetailRow label="Project" value={invoice.project_name} />
                <DetailRow label="Invoice #" value={invoice.invoice_number || "—"} />
                <DetailRow
                  label="Amount"
                  value={formatMoney(invoice.invoice_amount)}
                  valueClassName="text-base font-bold"
                />
                <DetailRow label="Invoice Date" value={formatDate(invoice.invoice_date)} />
                <DetailRow
                  label="Lien Waiver"
                  value={
                    invoice.lien_waiver_accepted ? (
                      <span className="text-emerald-700">✓ Signed</span>
                    ) : (
                      <span className="text-red-600">Not signed</span>
                    )
                  }
                />
                <DetailRow label="Submitted" value={submittedLabel} isLast />
              </section>

              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Attached File</h2>
                {invoice.file_path ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gol-dark">
                        {invoice.original_file_name || "invoice file"}
                      </div>
                      <div className="text-xs text-gol-muted mt-0.5">
                        Private — opens via short-lived signed URL
                      </div>
                    </div>
                    <ViewFileButton invoiceId={id} fileName={invoice.original_file_name || undefined} />
                  </div>
                ) : (
                  <p className="text-sm text-gol-muted">No file attached.</p>
                )}

                {invoice.tracking_token && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gol-muted mb-1">Subcontractor tracking link:</p>
                    <Link
                      href={`/invoice-status/${invoice.tracking_token}`}
                      className="text-xs font-semibold text-gol-green hover:text-gol-green-dark break-all"
                    >
                      /invoice-status/{invoice.tracking_token}
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-2">
              <InvoiceStatusActions
                invoiceId={id}
                currentStatus={invoice.invoice_status}
                currentNotes={invoice.admin_notes || ""}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
