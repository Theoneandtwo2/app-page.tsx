import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";
import StatusBadge from "@/components/StatusBadge";
import DetailRow from "@/components/DetailRow";
import DocumentStatusActions from "./DocumentStatusActions";
import DocFileButton from "./DocFileButton";

type PageProps = { params: Promise<{ id: string }> };

const FIELD_LABELS: Record<string, string> = {
  w9File: "W-9",
  coiFile: "COI",
  einFile: "EIN Letter",
  licenseFile: "Business License",
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env vars");
  return createSupabaseServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DocumentReviewPage({ params }: PageProps) {
  const { id } = await params;

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) redirect("/admin-login");

  const service = createServiceClient();
  const { data: doc, error } = await service
    .from("documents")
    .select(
      "id, company_name, contact_name, submitter_email, document_types, file_paths, status, admin_notes, uploaded_at, tracking_token"
    )
    .eq("id", id)
    .single();

  if (error || !doc) notFound();

  let files: { field: string; name: string; size?: number }[] = [];
  try {
    files = JSON.parse(doc.file_paths || "[]");
  } catch {
    files = [];
  }

  return (
    <div className="min-h-screen">
      <AdminNav email={user.email!} backToDashboard />

      <main className="px-4 sm:px-6 py-7 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="text-2xs font-bold tracking-eyebrow uppercase text-gol-green mb-1">
                Document Review
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gol-dark">
                {doc.company_name}
              </h1>
              <p className="text-sm text-gol-muted mt-1">
                {doc.contact_name} · Submitted {formatDate(doc.uploaded_at)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={doc.status} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Submission Details</h2>
                <DetailRow label="Company" value={doc.company_name} />
                <DetailRow label="Contact" value={doc.contact_name} />
                <DetailRow label="Email" value={doc.submitter_email} />
                <DetailRow label="Documents" value={doc.document_types} />
                <DetailRow label="Submitted" value={formatDate(doc.uploaded_at)} isLast />
              </section>

              <section className="bg-white border border-gol-border rounded-card shadow-card p-6">
                <h2 className="text-base font-semibold text-gol-dark mb-4">Uploaded Files</h2>
                {files.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <div className="text-sm font-semibold text-gol-dark">
                            {FIELD_LABELS[f.field] ?? f.field}
                            <span className="ml-2 font-normal text-gol-muted">{f.name}</span>
                          </div>
                        </div>
                        <DocFileButton docId={id} field={f.field} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gol-muted">No files attached.</p>
                )}

                {doc.tracking_token && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gol-muted mb-1">Subcontractor tracking link:</p>
                    <Link
                      href={`/document-status/${doc.tracking_token}`}
                      className="text-xs font-semibold text-gol-green hover:text-gol-green-dark break-all"
                    >
                      /document-status/{doc.tracking_token}
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-2">
              <DocumentStatusActions
                docId={id}
                currentStatus={doc.status}
                currentNotes={doc.admin_notes || ""}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
