import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const invoiceSchema = z.object({
  projectName: z.string().min(1),
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

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const authClient = await createSupabaseServerClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "You must be logged in to submit an invoice." },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, role, is_active, company_name, contact_name")
      .eq("email", user.email)
      .single();

    if (profileError || !profile || profile.is_active !== true) {
      return NextResponse.json(
        { error: "This email is not approved for portal access." },
        { status: 403 }
      );
    }

    if (!["admin", "subcontractor"].includes(profile.role)) {
      return NextResponse.json(
        { error: "This account is not allowed to submit invoices." },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const parsed = invoiceSchema.safeParse({
      projectName: formData.get("projectName"),
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
      return NextResponse.json({ error: "Invoice attachment required" }, { status: 400 });
    }

    const safeProject = parsed.data.projectName.replace(/[^a-z0-9_-]/gi, "_");
    const safeCompany = parsed.data.companyName.replace(/[^a-z0-9_-]/gi, "_");
    const filePath = `invoices/${safeProject}/${safeCompany}/${Date.now()}-${file.name}`;

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
        submitted_by_email: user.email,
        submitted_by_user_id: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json(
        { error: `Invoice insert failed: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
