import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import BrandHeader from "@/components/BrandHeader";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatMoney(v: string | number | null | undefined) {
  if (v == null) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? String(v) : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  company_name: string;
  project_name: string;
  invoice_number: string | null;
  invoice_amount: string | number | null;
  invoice_status: string;
  submitted_at: string | null;
  paid_at?: string | null;
};

type DocumentRow = {
  id: string;
  company_name: string;
  contact_name: string;
  document_types: string;
  status: string;
  uploaded_at: string | null;
};

type ProposalRow = {
  id: string;
  company_name: string;
  proposal_category: string;
  project_address: string;
  price: string | number | null;
  status: string;
  submitted_at: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin-login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <BrandHeader />
          <section className="bg-white border border-gol-border rounded-card shadow-card p-8">
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-red-600 mb-1">
              Access denied
            </div>
            <h1 className="text-xl font-bold text-gol-dark">Admin access required</h1>
            <p className="text-sm text-gol-muted mt-2.5 leading-relaxed">
              You are logged in, but this account is not approved as a Gol Homes admin.
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

  const service = getServiceClient();

  const [invoicesRes, documentsRes, proposalsRes] = await Promise.all([
    service.from("invoices")
      .select("id, company_name, project_name, invoice_number, invoice_amount, invoice_status, submitted_at, paid_at")
      .order("submitted_at", { ascending: false })
      .limit(50),
    service.from("documents")
      .select("id, company_name, contact_name, document_types, status, uploaded_at")
      .order("uploaded_at", { ascending: false })
      .limit(50),
    service.from("proposals")
      .select("id, company_name, proposal_category, project_address, price, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(50),
  ]);

  const invoices: InvoiceRow[] = invoicesRes.data || [];
  const documents: DocumentRow[] = documentsRes.data || [];
  const proposals: ProposalRow[] = proposalsRes.error ? [] : proposalsRes.data || [];
  const proposalsTableMissing =
    !!proposalsRes.error &&
    /relation .* does not exist|proposals/i.test(proposalsRes.error.message);

  const invoicesPending = invoices.filter((i) => i.invoice_status === "pending_review").length;
  const documentsPending = documents.filter((d) => d.status === "pending_review").length;
  const proposalsPending = proposals.filter((p) => p.status === "pending_review").length;

  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const paidThisMonth = invoices
    .filter((i) => i.invoice_status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((sum, i) => sum + (Number(i.invoice_amount) || 0), 0);

  return (
    <div className="min-h-screen">
      <AdminNav email={user.email!} />

      <main className="px-4 sm:px-6 py-7 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
              Admin
            </div>
            <h1 className="text-2xl font-bold text-gol-dark">Dashboard</h1>
            <p className="text-sm text-gol-muted mt-1">
              Review and manage all subcontractor submissions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard label="Invoices Pending" value={String(invoicesPending)} icon="📄" tone="amber" />
            <StatCard label="Documents Pending" value={String(documentsPending)} icon="📁" tone="amber" />
            <StatCard label="Proposals Pending" value={String(proposalsPending)} icon="📋" tone="amber" />
            <StatCard label="Paid This Month" value={formatMoney(paidThisMonth)} icon="💳" tone="green" />
          </div>

          <SectionCard icon="📄" title="Invoices" count={invoices.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gol-soft border-b border-gray-100">
                  <Th>Company</Th><Th>Project</Th><Th>Invoice #</Th>
                  <Th align="right">Amount</Th><Th>Status</Th><Th>Submitted</Th><Th />
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gol-muted">No invoices submitted yet.</td></tr>
                ) : (
                  invoices.map((i) => (
                    <tr key={i.id} className="border-b border-gray-50 hover:bg-gol-soft/40 transition-colors">
                      <Td className="font-semibold text-gol-dark">{i.company_name}</Td>
                      <Td>{i.project_name}</Td>
                      <Td>{i.invoice_number || "—"}</Td>
                      <Td align="right" className="font-semibold">{formatMoney(i.invoice_amount)}</Td>
                      <Td><StatusBadge status={i.invoice_status} size="sm" /></Td>
                      <Td className="text-gol-muted">{formatDate(i.submitted_at)}</Td>
                      <Td align="right">
                        <Link href={`/dashboard/invoices/${i.id}`} className="text-xs font-semibold text-gol-green hover:text-gol-green-dark whitespace-nowrap">
                          Review →
                        </Link>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard icon="📁" title="Supporting Documents" count={documents.length}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gol-soft border-b border-gray-100">
                  <Th>Company</Th><Th>Contact</Th><Th>Document Types</Th>
                  <Th>Status</Th><Th>Submitted</Th><Th />
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gol-muted">No documents submitted yet.</td></tr>
                ) : (
                  documents.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gol-soft/40 transition-colors">
                      <Td className="font-semibold text-gol-dark">{d.company_name}</Td>
                      <Td>{d.contact_name}</Td>
                      <Td className="text-gol-muted text-xs">{d.document_types}</Td>
                      <Td><StatusBadge status={d.status} size="sm" /></Td>
                      <Td className="text-gol-muted">{formatDate(d.uploaded_at)}</Td>
                      <Td align="right">
                        <Link href={`/dashboard/documents/${d.id}`} className="text-xs font-semibold text-gol-green hover:text-gol-green-dark whitespace-nowrap">
                          Review →
                        </Link>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard
            icon="📋"
            title="Proposals"
            count={proposals.length}
            emptyOverride={
              proposalsTableMissing
                ? "Run supabase/proposals-migration.sql to enable the proposals module."
                : undefined
            }
          >
            {proposalsTableMissing ? null : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gol-soft border-b border-gray-100">
                    <Th>Company</Th><Th>Project</Th><Th>Category</Th>
                    <Th align="right">Price</Th><Th>Status</Th><Th>Submitted</Th><Th />
                  </tr>
                </thead>
                <tbody>
                  {proposals.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gol-muted">No proposals submitted yet.</td></tr>
                  ) : (
                    proposals.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gol-soft/40 transition-colors">
                        <Td className="font-semibold text-gol-dark">{p.company_name}</Td>
                        <Td>{p.project_address}</Td>
                        <Td>{p.proposal_category}</Td>
                        <Td align="right" className="font-semibold">{formatMoney(p.price)}</Td>
                        <Td><StatusBadge status={p.status} size="sm" /></Td>
                        <Td className="text-gol-muted">{formatDate(p.submitted_at)}</Td>
                        <Td align="right">
                          <Link href={`/dashboard/proposals/${p.id}`} className="text-xs font-semibold text-gol-green hover:text-gol-green-dark whitespace-nowrap">
                            Review →
                          </Link>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label, value, icon, tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "amber" | "green";
}) {
  const toneCls = tone === "amber" ? "border-amber-200" : "border-emerald-200";
  const valueCls = tone === "amber" ? "text-amber-700" : "text-emerald-800";

  return (
    <div className={`bg-white rounded-2xl border ${toneCls} p-4 sm:p-5 shadow-card`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-gol-muted">{label}</span>
        <span className="text-lg" aria-hidden>{icon}</span>
      </div>
      <div className={`text-2xl sm:text-[26px] font-bold ${valueCls}`}>{value}</div>
    </div>
  );
}

function SectionCard({
  icon, title, count, children, emptyOverride,
}: {
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
  emptyOverride?: string;
}) {
  return (
    <section className="bg-white border border-gol-border rounded-card shadow-card mb-5 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
        <div className="text-[15px] font-semibold text-gol-dark">
          <span className="mr-2" aria-hidden>{icon}</span>{title}
        </div>
        <span className="text-[11px] text-gol-muted">{count} total</span>
      </div>
      <div className="overflow-x-auto">
        {emptyOverride ? (
          <p className="px-5 sm:px-6 pb-6 text-sm text-gol-muted">{emptyOverride}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 sm:px-5 py-2.5 text-2xs font-bold tracking-eyebrow uppercase text-gol-muted ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, align, className = "" }: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={`px-4 sm:px-5 py-3 text-sm text-gray-700 ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}
