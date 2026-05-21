import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

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

    const supabase = createServiceClient();


const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

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

    const { error } = await supabase
      .from("invoices")
      .update(updateValues)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Status update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL(`/dashboard/invoices/${id}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
