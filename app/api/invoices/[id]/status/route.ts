import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const statusSchema = z.object({
  invoiceStatus: z.enum([
    "pending_review",
    "incomplete",
    "approved",
    "rejected",
    "paid",
  ]),
});

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    pending_review: "Pending Review",
    incomplete: "Incomplete",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
  };

  return labels[status] || status;
}

function getAppUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getInvoiceStatusFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return body.invoiceStatus;
  }

  const formData = await request.formData();
  return formData.get("invoiceStatus");
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;

    const authClient = await createSupabaseServerClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    const invoiceStatus = await getInvoiceStatusFromRequest(request);
    const parsed = statusSchema.safeParse({ invoiceStatus });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice status." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const updateValues: Record<string, string> = {
      invoice_status: parsed.data.invoiceStatus,
      reviewed_at: now,
      reviewed_by_email: user.email,
    };

    if (parsed.data.invoiceStatus === "approved") {
      updateValues.approved_at = now;
    }

    if (parsed.data.invoiceStatus === "paid") {
      updateValues.paid_at = now;
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(updateValues)
      .eq("id", id)
      .select(
        "id, invoice_status, submitter_email, contact_name, company_name, project_name, invoice_number, invoice_amount, tracking_token"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Status update failed: ${error.message}` },
        { status: 500 }
      );
    }

    if (process.env.RESEND_API_KEY && invoice?.submitter_email && invoice?.tracking_token) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const appUrl = getAppUrl(request);
        const trackingUrl = `${appUrl}/invoice-status/${invoice.tracking_token}`;
        const statusLabel = formatStatus(parsed.data.invoiceStatus);

        await resend.emails.send({
          from: "Gol Homes Portal <onboarding@resend.dev>",
          to: invoice.submitter_email,
          subject: `Gol Homes — Invoice Status Updated to ${statusLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <h2>Invoice status updated</h2>
              <p>Hi ${invoice.contact_name || "there"},</p>
              <p>Your invoice status has been updated by Gol Homes.</p>
              <p><strong>Status:</strong> ${statusLabel}</p>
              <p><strong>Project:</strong> ${invoice.project_name || "N/A"}</p>
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number || "N/A"}</p>
              <p><strong>Amount:</strong> $${invoice.invoice_amount || "N/A"}</p>
              <p>You can view the current invoice status here:</p>
              <p>
                <a href="${trackingUrl}" target="_blank">
                  View Invoice Status
                </a>
              </p>
              <p>Gol Homes Development LLC</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Status email failed:", emailError);
      }
    }

    return NextResponse.redirect(new URL(`/dashboard/invoices/${id}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
