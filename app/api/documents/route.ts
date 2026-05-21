import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const documentSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  submitterEmail: z.string().email(),
  documentTypes: z.string().min(1), // comma-separated list
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

    const parsed = documentSchema.safeParse({
      companyName: formData.get("companyName"),
      contactName: formData.get("contactName"),
      submitterEmail: formData.get("submitterEmail"),
      documentTypes: formData.get("documentTypes"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Collect uploaded files (w9, coi, ein, license)
    const fileFields = ["w9File", "coiFile", "einFile", "licenseFile"];
    const uploadedFiles: { field: string; path: string; name: string; size: number }[] = [];

    const safeCompany = parsed.data.companyName.replace(/[^a-z0-9_-]/gi, "_");
    const trackingToken = crypto.randomBytes(32).toString("hex");

    for (const field of fileFields) {
      const file = formData.get(field);
      if (file instanceof File && file.size > 0) {
        const filePath = `documents/${safeCompany}/${field}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("portal-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (uploadError) {
          return NextResponse.json(
            { error: `Upload failed for ${field}: ${uploadError.message}` },
            { status: 500 }
          );
        }
        uploadedFiles.push({ field, path: filePath, name: file.name, size: file.size });
      }
    }

    if (uploadedFiles.length === 0) {
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
        file_paths: JSON.stringify(uploadedFiles),
        status: "pending_review",
        tracking_token: trackingToken,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `DB insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl(request);
    const trackingUrl = `${appUrl}/document-status/${trackingToken}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Gol Homes Portal <portal@golhomes.com>",
        to: parsed.data.submitterEmail,
        subject: "Gol Homes — Documents Received",
        html: `
          <h2>Supporting Documents Received</h2>
          <p>Hi ${parsed.data.contactName},</p>
          <p>Gol Homes has received your supporting documents.</p>
          <p><strong>Company:</strong> ${parsed.data.companyName}</p>
          <p><strong>Documents submitted:</strong> ${parsed.data.documentTypes}</p>
          <p><strong>Status:</strong> Pending Review</p>
          <p>Track your submission status here:<br/>
          <a href="${trackingUrl}">${trackingUrl}</a></p>
          <p>Please save this link for your records.</p>
          <p>Gol Homes Development LLC</p>
        `,
      });
    }

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
