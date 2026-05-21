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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("email", user.email)
      .single();

    if (!profile || profile.role !== "admin" || profile.is_active !== true) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice status." },
        { status: 400 }
      );
    }

    const updateValues: Record<string, string> = {
      invoice_status: parsed.data.invoiceStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.email,
    };

    if (parsed.data.invoiceStatus === "approved") {
      updateValues.approved_at = new Date().toISOString();
    }

    if (parsed.data.invoiceStatus === "paid") {
      updateValues.paid_at = new Date().toISOString();
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update(updateValues)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Status update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
