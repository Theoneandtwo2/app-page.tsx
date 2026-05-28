import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env vars");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const indexParam = searchParams.get("index");
  const index = indexParam !== null ? parseInt(indexParam, 10) : 0;

  const service = createServiceClient();
  const { data: row, error } = await service
    .from("proposals")
    .select("file_paths")
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let files: { path: string; name?: string }[] = [];
  try {
    files = Array.isArray(row.file_paths)
      ? row.file_paths
      : JSON.parse(row.file_paths || "[]");
  } catch {
    return NextResponse.json({ error: "Invalid file data" }, { status: 500 });
  }

  const target = files[index];
  if (!target?.path) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await service.storage
    .from("portal-files")
    .createSignedUrl(target.path, 60);
  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: `Could not generate signed URL: ${signError?.message}` },
      { status: 500 }
    );
  }
  return NextResponse.json({ url: signed.signedUrl, fileName: target.name });
}
