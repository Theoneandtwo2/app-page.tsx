import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    trackingToken: string;
  }>;
};

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing env vars");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_review: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
  },
  missing_info: {
    label: "Missing Info Needed",
    color: "bg-orange-100 text-orange-800",
  },
};

export default async function DocumentStatusPage({ params }: PageProps) {
  const { trackingToken } = await params;
  const supabase = createServiceClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("tracking_token", trackingToken)
    .single();

  if (error || !doc) {
    notFound();
  }

  const statusInfo = STATUS_LABELS[doc.status] ?? {
    label: doc.status,
    color: "bg-gray-100 text-gray-800",
  };

  const fileList: { field: string; name: string }[] = (() => {
    try {
      return JSON.parse(doc.file_paths || "[]");
    } catch {
      return [];
    }
  })();

  const fieldLabels: Record<string, string> = {
    w9File: "W-9",
    coiFile: "COI",
    einFile: "EIN Letter",
    licenseFile: "Business License",
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Document Submission Status
        </h1>

        <p className="text-gray-500 text-sm mb-6">
          Gol Homes Subcontractor Portal
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Company</span>
            <span className="font-medium text-gray-800">{doc.company_name}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Contact</span>
            <span className="font-medium text-gray-800">{doc.contact_name}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Documents</span>
            <span className="font-medium text-gray-800">
              {doc.document_types}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Submitted</span>
            <span className="font-medium text-gray-800">
              {new Date(doc.uploaded_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 mb-5">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Review Status
          </p>

          <span
            className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>

          {doc.admin_notes && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-0.5">Notes from Gol Homes:</p>
              <p>{doc.admin_notes}</p>
            </div>
          )}
        </div>

        {fileList.length > 0 && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Submitted Files
            </p>

            <ul className="space-y-1">
              {fileList.map((f, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">
                    {fieldLabels[f.field] ?? f.field}:
                  </span>
                  <span className="text-gray-500">{f.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
