import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { invoiceStatusUpdatedTemplate } from "@/lib/email/templates";

const statusSchema = z.object({
  invoiceStatus: z.enum(["pending_review", "incomplete", "approved", "rejected", "paid"]),
  adminNotes: z.string().optional().nullable(),
});

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server environment variables");
  return createSupabaseServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAppUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

type RouteProps = { params: Promise<{ id: string }> };

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      invoiceStatus: body.invoiceStatus ?? body.status,
      adminNotes: body.adminNotes ?? body.admin_notes ?? null,
      asJson: true as const,
    };
  }
  const fd = await request.formData();
  return {
    invoiceStatus: fd.get("invoiceStatus"),
    adminNotes: fd.get("adminNotes"),
    asJson: false as const,
  };
}

async function handle(request: Request, { params }: RouteProps) {
  const { id } = await params;

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { invoiceStatus, adminNotes, asJson } = await parseBody(request);
  const parsed = statusSchema.safeParse({ invoiceStatus, adminNotes });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invoice status." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const updateValues: Record<string, string | null> = {
    invoice_status: parsed.data.invoiceStatus,
    reviewed_at: now,
    reviewed_by_email: user.email,
  };
  if (parsed.data.adminNotes !== undefined && parsed.data.adminNotes !== null) {
    updateValues.admin_notes = parsed.data.adminNotes || null;
  }
  if (parsed.data.invoiceStatus === "approved") updateValues.approved_at = now;
  if (parsed.data.invoiceStatus === "paid") updateValues.paid_at = now;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update(updateValues)
    .eq("id", id)
    .select(
      "id, invoice_status, submitter_email, contact_name, company_name, project_name, invoice_number, invoice_amount, tracking_token, admin_notes"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: `Status update failed: ${error.message}` }, { status: 500 });
  }

  if (invoice?.submitter_email && invoice?.tracking_token) {
    const appUrl = getAppUrl(request);
    const trackingUrl = `${appUrl}/invoice-status/${invoice.tracking_token}`;
    const tpl = invoiceStatusUpdatedTemplate({
      contactName: invoice.contact_name,
      projectName: invoice.project_name,
      invoiceNumber: invoice.invoice_number,
      invoiceAmount: invoice.invoice_amount,
      status: parsed.data.invoiceStatus,
      adminNotes: invoice.admin_notes,
      trackingUrl,
    });
    sendEmail({ to: invoice.submitter_email, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error("[invoices/status] email error:", err));
  }

  if (asJson) return NextResponse.json({ ok: true, invoice });
  return NextResponse.redirect(new URL(`/dashboard/invoices/${id}`, request.url));
}

export async function POST(request: Request, ctx: RouteProps) {
  return handle(request, ctx);
}
export async function PATCH(request: Request, ctx: RouteProps) {
  return handle(request, ctx);
}
