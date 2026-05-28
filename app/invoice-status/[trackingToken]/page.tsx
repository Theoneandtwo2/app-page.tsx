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
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatMoney(value: string | number | null | undefined) {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function InvoiceStatusPage({ params }: PageProps) {
  const { trackingToken } = await params;
  const supabase = createServiceClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "project_name, company_name, contact_name, invoice_amount, invoice_number, invoice_date, invoice_status, submitted_at, admin_notes"
    )
    .eq("tracking_token", trackingToken)
    .single();

  if (error || !invoice) notFound();

  return (
    <main className="min-h-screen px-4 pt-10 pb-16 sm:pt-14">
      <div className="max-w-md mx-auto">
        <BrandHeader />

        <section className="bg-white border border-gol-border rounded-card shadow-card p-6 sm:p-8">
          <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
            Invoice Tracking
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gol-dark mb-2">Invoice Status</h1>
          <p className="text-sm text-gol-muted leading-relaxed mb-5">
            This private page shows the current review status for your submitted invoice.
          </p>

          <StatusHero status={invoice.invoice_status} />

          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2 mb-5">
            <DetailRow label="Invoice #" value={invoice.invoice_number || "—"} />
            <DetailRow label="Company" value={invoice.company_name} />
            <DetailRow label="Project" value={invoice.project_name} />
            <DetailRow
              label="Amount"
              value={formatMoney(invoice.invoice_amount)}
              valueClassName="text-base font-bold"
            />
            <DetailRow label="Invoice Date" value={formatDate(invoice.invoice_date)} />
            <DetailRow label="Submitted" value={formatDate(invoice.submitted_at)} isLast />
          </div>

          {invoice.admin_notes && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5">
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-blue-800 mb-1">
                📝 Notes from Gol Homes
              </div>
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">
                {invoice.admin_notes}
              </p>
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
