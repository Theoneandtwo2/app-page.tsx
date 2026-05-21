import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyInvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, is_active, company_name, contact_name")
    .eq("email", user.email)
    .single();

  if (!profile || profile.is_active !== true) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <section className="max-w-lg w-full bg-white border rounded-2xl shadow-sm p-8">
          <p className="text-sm uppercase tracking-wide text-red-600 font-semibold">
            Access not approved
          </p>

          <h1 className="text-2xl font-bold mt-2">Account not approved</h1>

          <p className="text-gray-600 mt-3">
            This email is not currently approved for portal access. Please contact Gol Homes.
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

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, project_name, invoice_amount, invoice_number, invoice_status, invoice_date, submitted_at"
    )
    .eq("submitted_by_email", user.email)
    .order("submitted_at", { ascending: false });

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
              Subcontractor
            </p>

            <h1 className="text-3xl font-bold">My Invoices</h1>

            <p className="text-gray-600 mt-2">
              View invoices submitted from your approved portal account.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="rounded-lg bg-gol-green text-white px-4 py-2"
          >
            Submit Invoice
          </Link>
        </div>

        <section className="bg-white border rounded-2xl mt-6 overflow-hidden">
          <div className="p-4 border-b font-semibold">Invoice Status</div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Project</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {(invoices || []).map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="p-3">{invoice.invoice_number || "—"}</td>
                  <td className="p-3">{invoice.project_name}</td>
                  <td className="p-3">${invoice.invoice_amount}</td>
                  <td className="p-3">{invoice.invoice_date}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs">
                      {invoice.invoice_status}
                    </span>
                  </td>
                </tr>
              ))}

              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td className="p-6 text-gray-500" colSpan={5}>
                    No invoices submitted from this account yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
