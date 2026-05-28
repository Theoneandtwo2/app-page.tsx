import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { documentStatusUpdatedTemplate } from "@/lib/email/templates";

const statusSchema = z.object({
  status: z.enum(["pending_review", "approved", "rejected", "missing_info"]),
  admin_notes: z.string().optional().nullable(),
});

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing env vars");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getAppUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

type RouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("documents")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.admin_notes ?? null,
      reviewed_by: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, status, submitter_email, contact_name, company_name, document_types, tracking_token, admin_notes"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: `Update failed: ${error?.message ?? "no row"}` },
      { status: 500 }
    );
  }

  if (data.submitter_email && data.tracking_token) {
    const appUrl = getAppUrl(request);
    const trackingUrl = `${appUrl}/document-status/${data.tracking_token}`;
    const tpl = documentStatusUpdatedTemplate({
      contactName: data.contact_name,
      companyName: data.company_name,
      documentTypes: data.document_types,
      status: parsed.data.status,
      adminNotes: data.admin_notes,
      trackingUrl,
    });
    sendEmail({ to: data.submitter_email, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error("[documents/status] email error:", err));
  }

  return NextResponse.json({ ok: true, document: data });
}
