import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending_review: "Pending Review",
    incomplete: "Incomplete",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
  };

  return labels[status] || status;
}

function StatusButton({
  invoiceId,
  invoiceStatus,
  label,
}: {
  invoiceId: string;
  invoiceStatus: string;
  label: string;
}) {
  return (
    <form action={`/api/invoices/${invoiceId}/status`} method="post">
      <input type="hidden" name="invoiceStatus" value={invoiceStatus} />
    </form>
  );
}

export default async function InvoiceReviewPage({ params }: PageProps) {
  const { id } = await params;

  const authClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("email", user.email)
    .single();

  if (!profile || profile.role !== "admin" || profile.is_active !== true) {
    redirect("/dashboard");
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const trackingPath = invoice.tracking_token
    ? `/invoice-status/${invoice.tracking_token}`
    : "";

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-gol-green font-medium">
          ← Back to dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 mt-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
              Admin Review
            </p>
            <h1 className="text-3xl font-bold">Invoice Review</h1>
            <p className="text-gray-600 mt-2">
              Review invoice details and update approval status.
            </p>
          </div>

          <span className="rounded-full bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
            {formatStatus(invoice.invoice_status)}
          </span>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white border rounded-2xl p-5">
            <h2 className="font-semibold text-lg">Invoice Details</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium">{invoice.invoice_number || "—"}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Company</dt>
                <dd className="font-medium">{invoice.company_name}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Contact</dt>
                <dd className="font-medium">{invoice.contact_name}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Submitter Email</dt>
                <dd className="font-medium">{invoice.submitter_email || "—"}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Project</dt>
                <dd className="font-medium">{invoice.project_name}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Amount</dt>
                <dd className="font-medium">${invoice.invoice_amount}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Invoice Date</dt>
                <dd className="font-medium">{invoice.invoice_date}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Lien Waiver</dt>
                <dd className="font-medium">
                  {invoice.lien_waiver_accepted ? "Accepted" : "Not accepted"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <h2 className="font-semibold text-lg">Review Actions</h2>

            <p className="text-sm text-gray-600 mt-2">
              Choose the current status for this invoice. This is what the
              subcontractor sees on their private tracking page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <StatusAction invoiceId={invoice.id} status="approved" label="Approve" />
              <StatusAction invoiceId={invoice.id} status="paid" label="Mark Paid" />
              <StatusAction invoiceId={invoice.id} status="incomplete" label="Incomplete" />
              <StatusAction invoiceId={invoice.id} status="rejected" label="Reject" />
            </div>

            <div className="mt-6 border-t pt-4 text-sm">
              <p>
                <span className="text-gray-500">Uploaded file:</span>{" "}
                {invoice.original_file_name || "—"}
              </p>

              <p className="mt-2">
                <span className="text-gray-500">Storage path:</span>{" "}
                <span className="break-all">{invoice.file_path || "—"}</span>
              </p>

              {trackingPath && (
                <p className="mt-2">
                  <span className="text-gray-500">Tracking link:</span>{" "}
                  <Link href={trackingPath} className="text-gol-green font-medium">
                    Open status page
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-5 mt-4">
          <h2 className="font-semibold text-lg">Timestamps</h2>

          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <dt className="text-gray-500">Submitted</dt>
              <dd className="font-medium">
                {invoice.submitted_at
                  ? new Date(invoice.submitted_at).toLocaleString()
                  : "—"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Reviewed</dt>
              <dd className="font-medium">
                {invoice.reviewed_at
                  ? new Date(invoice.reviewed_at).toLocaleString()
                  : "—"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Reviewed By</dt>
              <dd className="font-medium">{invoice.reviewed_by || "—"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}

function StatusAction({
  invoiceId,
  status,
  label,
}: {
  invoiceId: string;
  status: string;
  label: string;
}) {
  return (
    <form
      action={`/api/invoices/${invoiceId}/status`}
      method="post"
      className="w-full"
    >
      <input type="hidden" name="invoiceStatus" value={status} />
      <button className="w-full rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">
        {label}
      </button>
    </form>
  );
}
