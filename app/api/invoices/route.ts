import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const invoiceSchema = z.object({
  projectName: z.string().min(1),
  submitterEmail: z.string().email(),
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  invoiceAmount: z.string().min(1),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().min(1),
  lienWaiverAccepted: z.literal("on"),
});

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getAppUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    const formData = await request.formData();

    const parsed = invoiceSchema.safeParse({
      projectName: formData.get("projectName"),
      submitterEmail: formData.get("submitterEmail"),
      companyName: formData.get("companyName"),
      contactName: formData.get("contactName"),
      invoiceAmount: formData.get("invoiceAmount"),
      invoiceNumber: formData.get("invoiceNumber") || "",
      invoiceDate: formData.get("invoiceDate"),
      lienWaiverAccepted: formData.get("lienWaiverAccepted"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const file = formData.get("invoiceFile");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invoice attachment required" },
        { status: 400 }
      );
    }

    const safeProject = parsed.data.projectName.replace(/[^a-z0-9_-]/gi, "_");
    const safeCompany = parsed.data.companyName.replace(/[^a-z0-9_-]/gi, "_");
    const filePath = `invoices/${safeProject}/${safeCompany}/${Date.now()}-${file.name}`;
    const trackingToken = crypto.randomBytes(32).toString("hex");

    const { error: uploadError } = await supabase.storage
      .from("portal-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        project_name: parsed.data.projectName,
        company_name: parsed.data.companyName,
        contact_name: parsed.data.contactName,
        invoice_amount: parsed.data.invoiceAmount,
        invoice_number: parsed.data.invoiceNumber || null,
        invoice_date: parsed.data.invoiceDate,
        lien_waiver_accepted: true,
        invoice_status: "pending_review",
        file_path: filePath,
        submitter_email: parsed.data.submitterEmail,
        tracking_token: trackingToken,
        original_file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json(
        { error: `Invoice insert failed: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl(request);
    const trackingUrl = `${appUrl}/invoice-status/${trackingToken}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Gol Homes Portal <portal@golhomes.com>",
        to: parsed.data.submitterEmail,
        subject: "Gol Homes — Invoice Received",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Invoice received</h2>
            <p>Hi ${parsed.data.contactName},</p>
            <p>Gol Homes has received your invoice submission.</p>
            <p><strong>Status:</strong> Pending Review</p>
            <p><strong>Project:</strong> ${parsed.data.projectName}</p>
            <p><strong>Invoice Number:</strong> ${parsed.data.invoiceNumber || "N/A"}</p>
            <p><strong>Amount:</strong> $${parsed.data.invoiceAmount}</p>
            <p>You can track the invoice status using this private link:</p>
            <p>
              <a href="${trackingUrl}" target="_blank">
                View Invoice Status
              </a>
            </p>
            <p>Please save this email for your records.</p>
            <p>Gol Homes Development LLC</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      invoice,
      trackingUrl: `/invoice-status/${trackingToken}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
