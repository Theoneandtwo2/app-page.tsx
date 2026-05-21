import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Admin only
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const field = searchParams.get("field");

  const service = createServiceClient();
  const { data: doc, error } = await service
    .from("documents")
    .select("file_paths")
    .eq("id", params.id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let filePath: string | null = null;
  try {
    const files: { field: string; path: string }[] = JSON.parse(doc.file_paths);
    const match = field ? files.find((f) => f.field === field) : files[0];
    filePath = match?.path ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid file data" }, { status: 500 });
  }

  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: signedUrl, error: signError } = await service.storage
    .from("portal-files")
    .createSignedUrl(filePath, 300);

  if (signError || !signedUrl) {
    return NextResponse.json(
      { error: `Failed to generate signed URL: ${signError?.message}` },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
