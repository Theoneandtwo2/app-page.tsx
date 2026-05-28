import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/send";
import { proposalReceivedTemplate } from "@/lib/email/templates";

const MAX_FILES = 5;

const proposalSchema = z.object({
  submitterEmail: z.string().email(),
  companyName: z.string().min(1),
  contactName: z.string().optional().nullable(),
  proposalCategory: z.string().min(1),
  projectAddress: z.string().min(1),
  price: z.string().min(1),
  optionPrice: z.string().optional().nullable(),
  soonestStartDate: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
});

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server environment variables");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getAppUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function nullable(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const fd = await request.formData();

    const parsed = proposalSchema.safeParse({
      submitterEmail: fd.get("submitterEmail"),
      companyName: fd.get("companyName"),
      contactName: nullable(fd.get("contactName")),
      proposalCategory: fd.get("proposalCategory"),
      projectAddress: fd.get("projectAddress"),
      price: fd.get("price"),
      optionPrice: nullable(fd.get("optionPrice")),
      soonestStartDate: nullable(fd.get("soonestStartDate")),
      duration: nullable(fd.get("duration")),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid proposal submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rawFiles = fd
      .getAll("proposalFiles")
      .filter((x): x is File => x instanceof File && x.size > 0);

    if (rawFiles.length === 0) {
      return NextResponse.json({ error: "At least one proposal file is required" }, { status: 400 });
    }
    if (rawFiles.length > MAX_FILES) {
      return NextResponse.json({ error: `Please attach no more than ${MAX_FILES} files.` }, { status: 400 });
    }

    const safeCompany = parsed.data.companyName.replace(/[^a-z0-9_-]/gi, "_");
    const trackingToken = crypto.randomBytes(32).toString("hex");

    const uploaded: { path: string; name: string; size: number; index: number }[] = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const path = `proposals/${safeCompany}/${Date.now()}-${i}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("portal-files")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
      if (upErr) {
        if (uploaded.length > 0) {
          await supabase.storage
            .from("portal-files")
            .remove(uploaded.map((u) => u.path))
            .catch(() => {});
        }
        return NextResponse.json({ error: `File upload failed: ${upErr.message}` }, { status: 500 });
      }
      uploaded.push({ path, name: file.name, size: file.size, index: i });
    }

    const priceNum = Number(parsed.data.price);
    const optionPriceNum =
      parsed.data.optionPrice && parsed.data.optionPrice.length > 0
        ? Number(parsed.data.optionPrice)
        : null;

    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert({
        submitter_email: parsed.data.submitterEmail,
        company_name: parsed.data.companyName,
        contact_name: parsed.data.contactName || null,
        proposal_category: parsed.data.proposalCategory,
        project_address: parsed.data.projectAddress,
        price: priceNum,
        option_price: optionPriceNum,
        soonest_start_date: parsed.data.soonestStartDate || null,
        duration: parsed.data.duration || null,
        file_paths: uploaded,
        status: "pending_review",
        tracking_token: trackingToken,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage
        .from("portal-files")
        .remove(uploaded.map((u) => u.path))
        .catch(() => {});
      return NextResponse.json(
        { error: `DB insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl(request);
    const trackingUrl = `${appUrl}/proposal-status/${trackingToken}`;

    const tpl = proposalReceivedTemplate({
      companyName: parsed.data.companyName,
      category: parsed.data.proposalCategory,
      projectAddress: parsed.data.projectAddress,
      price: parsed.data.price,
      trackingUrl,
    });
    sendEmail({ to: parsed.data.submitterEmail, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error("[proposals] email error:", err));

    return NextResponse.json({
      ok: true,
      proposal,
      trackingUrl: `/proposal-status/${trackingToken}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
