import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail || user.email !== adminEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <section className="max-w-lg w-full bg-white border rounded-2xl shadow-sm p-8">
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Access denied
          </p>
          <h1 className="text-2xl font-bold mt-2">Admin access required</h1>
          <p className="text-gray-600 mt-3">
            You are logged in, but this account is not approved as a Gol Homes admin.
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

  const service = getServiceClient();

  const { data: invoices } = await service
    .from("invoices")
    .select(
      "id, company_name, project_name, invoice_amount, invoice_number, invoice_status, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .limit(25);

  const { data: documents } = await service
    .from("documents")
    .select(
      "id, company_name, contact_name, document_types, status, uploaded_at"
    )
    .order("uploaded_at", { ascending: false })
    .limit(25);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Admin</p>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <Link
            href="/invoices/new"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            + Submit Test Invoice
          </Link>
        </div>

        {/* Invoices Section */}
        <section className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Invoice Submissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(invoices || []).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{invoice.invoice_number || "\u2014"}</td>
                    <td className="px-4 py-3">{invoice.company_name}</td>
                    <td className="px-4 py-3">{invoice.project_name}</td>
                    <td className="px-4 py-3 text-right">${invoice.invoice_amount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                        {invoice.invoice_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!invoices || invoices.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Documents Section */}
        <section className="bg-white rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Supporting Documents</h2>
            <Link
              href="/submit-documents"
              className="text-xs text-blue-600 hover:underline"
            >
              + Submit Test Docs
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(documents || []).map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{doc.company_name}</td>
                    <td className="px-4 py-3">{doc.contact_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{doc.document_types}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!documents || documents.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No documents submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
