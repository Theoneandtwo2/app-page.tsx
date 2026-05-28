import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: Promise<{
    trackingToken: string;
  }>;
};

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
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

export default async function InvoiceStatusPage({ params }: PageProps) {
  const { trackingToken } = await params;
    console.log("INVOICE_STATUS_DEBUG token", trackingToken);
  const supabase = createServiceClient();
    console.log("INVOICE_STATUS_DEBUG supabase url", process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "project_name, company_name, contact_name, invoice_amount, invoice_number, invoice_date, invoice_status, submitted_at"
    )
    .eq("tracking_token", trackingToken)
    .single();
    console.log("INVOICE_STATUS_DEBUG result", { invoice, error });

  if (error || !invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="max-w-2xl w-full bg-white border rounded-2xl shadow-sm p-8">
        <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
          Gol Homes Development LLC
        </p>

        <h1 className="text-3xl font-bold mt-3">Invoice Status</h1>

        <p className="text-gray-600 mt-3">
          This private status page shows the current review status for your submitted
          invoice.
        </p>

        <div className="mt-6 rounded-xl border overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Status</div>
            <div className="p-4">
              <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-sm">
                {formatStatus(invoice.invoice_status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Company</div>
            <div className="p-4">{invoice.company_name}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Project</div>
            <div className="p-4">{invoice.project_name}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Invoice #</div>
            <div className="p-4">{invoice.invoice_number || "—"}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Amount</div>
            <div className="p-4">${invoice.invoice_amount}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 border-b">
            <div className="p-4 bg-gray-50 font-medium">Invoice Date</div>
            <div className="p-4">{invoice.invoice_date}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-4 bg-gray-50 font-medium">Submitted</div>
            <div className="p-4">
              {new Date(invoice.submitted_at).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-5">
          Keep this link for your records. Gol Homes will update the invoice status
          after review.
        </p>

        <Link
          href="/"
          className="inline-block mt-6 rounded-lg bg-gol-green text-white px-4 py-2"
        >
          Back to portal
        </Link>
      </section>
    </main>
  );
}
