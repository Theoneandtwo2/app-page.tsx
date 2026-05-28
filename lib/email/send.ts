/**
 * Provider-flexible email helper.
 *
 * Resolution order at runtime (first that has the required env vars wins):
 *   1. SMTP    (EMAIL_PROVIDER=smtp OR SMTP_HOST present)
 *              requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *              works with SMTP2GO free tier, Google Workspace SMTP, etc.
 *   2. SendGrid (EMAIL_PROVIDER=sendgrid OR SENDGRID_API_KEY present)
 *              requires SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 *   3. Resend  (EMAIL_PROVIDER=resend OR RESEND_API_KEY present)
 *              requires RESEND_API_KEY (uses EMAIL_FROM if set, else
 *              `onboarding@resend.dev` sandbox fallback)
 *   4. None    — returns ok with skipped=true. The app never crashes if email
 *              is not configured. This is intentional: submissions and status
 *              changes must still succeed while the email provider question
 *              is being worked out.
 *
 * If sending fails (network, auth, etc.) we log the error and still return
 * ok=true with `error` populated, so the calling route can ignore it without
 * failing the user's submission. Submissions must never block on email.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailResult = {
  ok: boolean;
  provider: string | null;
  skipped?: boolean;
  error?: string;
};

type Provider = "smtp" | "sendgrid" | "resend" | "none";

function resolveProvider(): Provider {
  const explicit = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  if (explicit === "smtp" || explicit === "sendgrid" || explicit === "resend") {
    return explicit;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "smtp";
  }
  if (process.env.SENDGRID_API_KEY) {
    return "sendgrid";
  }
  if (process.env.RESEND_API_KEY) {
    return "resend";
  }
  return "none";
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SENDGRID_FROM_EMAIL ||
    "Gol Homes Portal <onboarding@resend.dev>"
  );
}

function plainTextFromHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function sendViaSmtp(msg: EmailMessage): Promise<EmailResult> {
  const nodemailer = await import("nodemailer");

  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: fromAddress(),
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text ?? plainTextFromHtml(msg.html),
  });

  return { ok: true, provider: "smtp" };
}

async function sendViaSendgrid(msg: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY!;
  const from = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("SendGrid configured but SENDGRID_FROM_EMAIL / EMAIL_FROM is missing");
  }

  const fromValue = from.includes("<")
    ? (() => {
        const match = from.match(/^(.*?)\s*<(.+?)>$/);
        return match ? { email: match[2].trim(), name: match[1].trim() } : { email: from };
      })()
    : { email: from };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: fromValue,
      subject: msg.subject,
      content: [
        { type: "text/plain", value: msg.text ?? plainTextFromHtml(msg.html) },
        { type: "text/html", value: msg.html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid error ${res.status}: ${body.slice(0, 300)}`);
  }
  return { ok: true, provider: "sendgrid" };
}

async function sendViaResend(msg: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY!;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text ?? plainTextFromHtml(msg.html),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${body.slice(0, 300)}`);
  }
  return { ok: true, provider: "resend" };
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!msg.to || !msg.subject || !msg.html) {
    return { ok: false, provider: null, error: "sendEmail called with missing to/subject/html" };
  }

  const provider = resolveProvider();

  if (provider === "none") {
    console.warn(
      `[email] skipped: no provider configured (to=${msg.to}, subject="${msg.subject}")`
    );
    return { ok: true, provider: null, skipped: true };
  }

  try {
    if (provider === "smtp") return await sendViaSmtp(msg);
    if (provider === "sendgrid") return await sendViaSendgrid(msg);
    if (provider === "resend") return await sendViaResend(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${provider} send failed:`, message);
    return { ok: true, provider, error: message };
  }

  return { ok: false, provider: null, error: "no provider matched" };
}
