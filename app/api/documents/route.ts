import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/send";
import { documentReceivedTemplate } from "@/lib/email/templates";

const documentSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  submitterEmail: z.string().email(),
  documentTypes: z.string().min(1),
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

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const fd = await request.formData();

    const parsed = documentSchema.safeParse({
      companyName: fd.get("companyName"),
      contactName: fd.get("contactName"),
      submitterEmail: fd.get("submitterEmail"),
      documentTypes: fd.get("documentTypes"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const fileFields = ["w9File", "coiFile", "einFile", "licenseFile"];
    const uploaded: { field: string; path: string; name: string; size: number }[] = [];

    const safeCompany = parsed.data.companyName.replace(/[^a-z0-9_-]/gi, "_");
    const trackingToken = crypto.randomBytes(32).toString("hex");

    for (const field of fileFields) {
      const file = fd.get(field);
      if (file instanceof File && file.size > 0) {
        const path = `documents/${safeCompany}/${field}/${Date.now()}-${file.name}`;
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
          return NextResponse.json(
            { error: `Upload failed for ${field}: ${upErr.message}` },
            { status: 500 }
          );
        }
        uploaded.push({ field, path, name: file.name, size: file.size });
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "At least one document file is required" },
        { status: 400 }
      );
    }

    const { data: docRecord, error: insertError } = await supabase
      .from("documents")
      .insert({
        company_name: parsed.data.companyName,
        contact_name: parsed.data.contactName,
        submitter_email: parsed.data.submitterEmail,
        document_types: parsed.data.documentTypes,
        file_paths: JSON.stringify(uploaded),
        status: "pending_review",
        tracking_token: trackingToken,
        uploaded_at: new Date().toISOString(),
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
    const trackingUrl = `${appUrl}/document-status/${trackingToken}`;

    const tpl = documentReceivedTemplate({
      contactName: parsed.data.contactName,
      companyName: parsed.data.companyName,
      documentTypes: parsed.data.documentTypes,
      trackingUrl,
    });
    sendEmail({ to: parsed.data.submitterEmail, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error("[documents] email error:", err));

    return NextResponse.json({
      ok: true,
      document: docRecord,
      trackingUrl: `/document-status/${trackingToken}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
