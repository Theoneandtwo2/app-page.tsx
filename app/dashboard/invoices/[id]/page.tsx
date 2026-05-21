import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import ViewFileButton from "./ViewFileButton";

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

export default async function InvoiceReviewPage({ params }: PageProps) {
  const { id } = await params;
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect("/admin-login");
  }

  const serviceClient = createServiceClient();
  const { data: invoice, error } = await serviceClient
    .from("invoices")
    .select(
      "id, project_name, submitter_email, company_name, contact_name, invoice_amount, invoice_number, invoice_date, lien_waiver_accepted, file_path, original_file_name, invoice_status, tracking_token, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const trackingPath = invoice.tracking_token
    ? `/invoice-status/${invoice.tracking_token}`
    : "";

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <Link
        href="/dashboard"
        className="text-sm text-gol-green hover:underline"
      >
        &larr; Back to dashboard
      </Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
            Admin Review
          </p>
          <h1 className="text-2xl font-bold">Invoice Review</h1>
          <p className="text-gray-600 mt-1">
            Review invoice details and update approval status.
          </p>
        </div>
        <span className="rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1">
          {formatStatus(invoice.invoice_status)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Details */}
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Invoice Details</h2>
          <dl className="space-y-3 text-sm">
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
              <dd className="font-medium">{invoice.submitter_email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Project</dt>
              <dd className="font-medium">{invoice.project_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-medium">
                ${Number(invoice.invoice_amount).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Invoice Date</dt>
              <dd className="font-medium">{invoice.invoice_date}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Lien Waiver</dt>
              <dd className="font-medium">
                {invoice.lien_waiver_accepted ? "Accepted" : "Not Accepted"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Review Actions */}
        <div className="bg-white border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-2">Review Actions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose the current status for this invoice. This is what the
            subcontractor sees on their private tracking page.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatusAction invoiceId={id} status="approved" label="Approve" />
            <StatusAction invoiceId={id} status="paid" label="Mark Paid" />
            <StatusAction invoiceId={id} status="incomplete" label="Incomplete" />
            <StatusAction invoiceId={id} status="rejected" label="Reject" />
          </div>

          <div className="mt-6 border-t pt-4 text-sm">
            {invoice.file_path ? (
              <>
                <p className="text-gray-500 mb-1">Invoice file:</p>
                <ViewFileButton
                  invoiceId={id}
                  fileName={invoice.original_file_name || undefined}
                />
              </>
            ) : (
              <p>
                <span className="text-gray-500">Uploaded file:</span> —
              </p>
            )}
            {trackingPath && (
              <p className="mt-3">
                <span className="text-gray-500">Tracking link:</span>{" "}
                <Link href={trackingPath} className="text-gol-green font-medium">
                  Open status page
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
