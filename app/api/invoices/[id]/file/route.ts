import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }
  return createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check — admin only
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  // Fetch invoice to get file_path
  const serviceClient = getServiceClient();
  const { data: invoice, error } = await serviceClient
    .from("invoices")
    .select("file_path, original_file_name")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!invoice.file_path) {
    return NextResponse.json({ error: "No file attached to this invoice" }, { status: 404 });
  }

  // Generate a signed URL valid for 60 seconds (single-use view)
  const { data: signedData, error: signError } = await serviceClient.storage
    .from("portal-files")
    .createSignedUrl(invoice.file_path, 60);

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json({ error: "Could not generate file URL" }, { status: 500 });
  }

  return NextResponse.json({
    url: signedData.signedUrl,
    fileName: invoice.original_file_name || "invoice-file",
  });
}
