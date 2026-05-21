import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <section className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border p-8">
        <p className="text-sm uppercase tracking-wide text-gol-green font-semibold">
          Gol Homes Development LLC
        </p>

        <h1 className="text-3xl font-bold mt-3">Subcontractor Portal</h1>

        <p className="text-gray-600 mt-3">
          Submit invoices securely and receive a private tracking link for status updates.
          Gol Homes reviews submissions through a protected admin dashboard.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            className="px-4 py-2 rounded-lg bg-gol-green text-white"
            href="/invoices/new"
          >
            Submit Invoice
          </Link>
        </div>
      </section>
    </main>
  );
}
