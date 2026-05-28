/**
 * Email templates for the Gol Homes Subcontractor Portal.
 *
 * All templates produce mobile-friendly HTML with inline styles so they
 * render consistently across Gmail, Outlook, Apple Mail, etc.
 */

const BRAND_GREEN = "#1a6b47";
const DARK = "#0f1a14";
const MUTED = "#6b7280";

function shell(opts: {
  heading: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const cta = opts.ctaUrl
    ? `
        <tr>
          <td style="padding: 24px 32px 4px 32px;" align="left">
            <a href="${opts.ctaUrl}"
               style="display: inline-block; background: ${BRAND_GREEN}; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 10px; text-decoration: none;">
              ${opts.ctaLabel ?? "View Status"}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 32px 12px 32px; font-size: 12px; color: ${MUTED};">
            Or paste this link into your browser:<br>
            <span style="word-break: break-all; color: ${MUTED};">${opts.ctaUrl}</span>
          </td>
        </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.heading}</title>
</head>
<body style="margin:0; padding:0; background:#f4f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${DARK};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f5f2;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px 4px 32px;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${BRAND_GREEN};">
                Gol Homes Development LLC
              </div>
              <div style="font-size: 12px; color: ${MUTED}; margin-top: 4px;">Subcontractor Portal</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 4px 32px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: ${DARK};">${opts.heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 32px 0 32px; font-size: 14px; line-height: 1.6; color: ${DARK};">
              ${opts.bodyHtml}
            </td>
          </tr>
          ${cta}
          <tr>
            <td style="padding: 24px 32px 28px 32px; border-top: 1px solid #f3f4f6; margin-top: 12px;">
              <p style="margin: 0; font-size: 11px; color: ${MUTED};">
                Gol Homes Development LLC &middot; This is an automated message from the subcontractor portal.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_review: "Pending Review",
    incomplete: "Incomplete",
    missing_info: "Missing Info",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
  };
  return labels[status] || status;
}

function pill(label: string, color: string): string {
  return `<span style="display:inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: ${color}1A; color: ${color}; border: 1px solid ${color}55;">${label}</span>`;
}

function statusPill(status: string): string {
  const color =
    status === "approved" ? "#065f46"
    : status === "paid" ? "#1d4ed8"
    : status === "rejected" ? "#991b1b"
    : status === "incomplete" || status === "missing_info" ? "#c2410c"
    : "#b45309";
  return pill(statusLabel(status), color);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============ INVOICE ============

export function invoiceReceivedTemplate(opts: {
  contactName: string;
  projectName: string;
  invoiceNumber?: string | null;
  invoiceAmount: string | number;
  trackingUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.contactName)},</p>
    <p style="margin:0 0 12px 0;">Gol Homes has received your invoice submission. Status: ${statusPill("pending_review")}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 12px 0 4px 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Project</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.projectName)}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Invoice #</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.invoiceNumber || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Amount</td><td align="right" style="font-weight:700; padding:4px 0;">$${escapeHtml(String(opts.invoiceAmount))}</td></tr>
    </table>
    <p style="margin: 12px 0 0 0;">Use the button below to track the status of your invoice at any time.</p>
  `;
  return {
    subject: "Gol Homes — Invoice Received",
    html: shell({
      heading: "Invoice received",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Invoice Status",
    }),
  };
}

export function invoiceStatusUpdatedTemplate(opts: {
  contactName: string | null;
  projectName: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: string | number | null;
  status: string;
  adminNotes?: string | null;
  trackingUrl: string;
}) {
  const notesBlock = opts.adminNotes
    ? `<div style="margin:14px 0 0 0; padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius: 10px; color:#1e3a8a; font-size:13px;">
         <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#1e40af; margin-bottom:4px;">Notes from Gol Homes</div>
         ${escapeHtml(opts.adminNotes)}
       </div>`
    : "";

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.contactName || "there")},</p>
    <p style="margin:0 0 12px 0;">Your invoice status has been updated: ${statusPill(opts.status)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 4px 0 0 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Project</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.projectName || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Invoice #</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.invoiceNumber || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Amount</td><td align="right" style="font-weight:700; padding:4px 0;">${opts.invoiceAmount ? `$${escapeHtml(String(opts.invoiceAmount))}` : "N/A"}</td></tr>
    </table>
    ${notesBlock}
  `;
  return {
    subject: `Gol Homes — Invoice ${statusLabel(opts.status)}`,
    html: shell({
      heading: "Invoice status updated",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Invoice Status",
    }),
  };
}

// ============ DOCUMENTS ============

export function documentReceivedTemplate(opts: {
  contactName: string;
  companyName: string;
  documentTypes: string;
  trackingUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.contactName)},</p>
    <p style="margin:0 0 12px 0;">Gol Homes has received your supporting documents. Status: ${statusPill("pending_review")}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 12px 0 0 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Company</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.companyName)}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Documents</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.documentTypes)}</td></tr>
    </table>
  `;
  return {
    subject: "Gol Homes — Documents Received",
    html: shell({
      heading: "Documents received",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Document Status",
    }),
  };
}

export function documentStatusUpdatedTemplate(opts: {
  contactName: string | null;
  companyName: string | null;
  documentTypes: string | null;
  status: string;
  adminNotes?: string | null;
  trackingUrl: string;
}) {
  const notesBlock = opts.adminNotes
    ? `<div style="margin:14px 0 0 0; padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius: 10px; color:#1e3a8a; font-size:13px;">
         <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#1e40af; margin-bottom:4px;">Notes from Gol Homes</div>
         ${escapeHtml(opts.adminNotes)}
       </div>`
    : "";

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.contactName || "there")},</p>
    <p style="margin:0 0 12px 0;">Your document submission status has been updated: ${statusPill(opts.status)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 4px 0 0 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Company</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.companyName || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Documents</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.documentTypes || "N/A")}</td></tr>
    </table>
    ${notesBlock}
  `;
  return {
    subject: `Gol Homes — Documents ${statusLabel(opts.status)}`,
    html: shell({
      heading: "Document status updated",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Document Status",
    }),
  };
}

// ============ PROPOSALS ============

export function proposalReceivedTemplate(opts: {
  companyName: string;
  category: string;
  projectAddress: string;
  price: string | number;
  trackingUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.companyName)},</p>
    <p style="margin:0 0 12px 0;">Gol Homes has received your project proposal. Status: ${statusPill("pending_review")}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 12px 0 0 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Category</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.category)}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Project</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.projectAddress)}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Price</td><td align="right" style="font-weight:700; padding:4px 0;">$${escapeHtml(String(opts.price))}</td></tr>
    </table>
  `;
  return {
    subject: "Gol Homes — Proposal Received",
    html: shell({
      heading: "Proposal received",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Proposal Status",
    }),
  };
}

export function proposalStatusUpdatedTemplate(opts: {
  companyName: string | null;
  category: string | null;
  projectAddress: string | null;
  price?: string | number | null;
  status: string;
  adminNotes?: string | null;
  trackingUrl: string;
}) {
  const notesBlock = opts.adminNotes
    ? `<div style="margin:14px 0 0 0; padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius: 10px; color:#1e3a8a; font-size:13px;">
         <div style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#1e40af; margin-bottom:4px;">Notes from Gol Homes</div>
         ${escapeHtml(opts.adminNotes)}
       </div>`
    : "";

  const body = `
    <p style="margin:0 0 12px 0;">Hi ${escapeHtml(opts.companyName || "there")},</p>
    <p style="margin:0 0 12px 0;">Your proposal status has been updated: ${statusPill(opts.status)}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; font-size: 13px; margin: 4px 0 0 0;">
      <tr><td style="color:${MUTED}; padding:4px 0;">Category</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.category || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Project</td><td align="right" style="font-weight:600; padding:4px 0;">${escapeHtml(opts.projectAddress || "N/A")}</td></tr>
      <tr><td style="color:${MUTED}; padding:4px 0;">Price</td><td align="right" style="font-weight:700; padding:4px 0;">${opts.price ? `$${escapeHtml(String(opts.price))}` : "N/A"}</td></tr>
    </table>
    ${notesBlock}
  `;
  return {
    subject: `Gol Homes — Proposal ${statusLabel(opts.status)}`,
    html: shell({
      heading: "Proposal status updated",
      bodyHtml: body,
      ctaUrl: opts.trackingUrl,
      ctaLabel: "View Proposal Status",
    }),
  };
}
