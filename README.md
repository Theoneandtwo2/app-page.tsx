# Gol Homes Subcontractor Portal

A simple, public-submission portal where subcontractors send Gol Homes their
invoices, supporting documents, and proposals. Admins review everything
through a private, magic-link-gated dashboard.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS 3.4
- Supabase Postgres (data) + Supabase Storage (private files)
- Supabase Auth (admin magic links only)
- Email: provider-flexible helper (SMTP, SendGrid, Resend, or skip)
- Hosting: Vercel

## Core decisions

- **Subcontractors do NOT have accounts.** They submit publicly via web
  forms, get a tracking link by email, and that's it.
- **Email is the primary status channel.** The on-screen confirmation always
  shows a backup tracking link, but the email is the intended method.
- **Admin access is locked to `ADMIN_EMAIL`.** Any other email that
  authenticates is shown an "Access denied" card.
- **All files are private.** Stored in Supabase Storage, opened only via
  60-second admin-only signed URLs. The storage bucket is never public.
- **Admin login is hidden.** No link to it on the public homepage. Reachable
  only by typing `/admin-login` directly.

## Routes

### Public

| Route                                  | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `/`                                    | Homepage with three action cards     |
| `/invoices/new`                        | Submit an invoice                    |
| `/invoice-status/[trackingToken]`      | Subcontractor invoice tracking page  |
| `/submit-documents`                    | Submit W-9 / COI / EIN / license     |
| `/document-status/[trackingToken]`     | Subcontractor document tracking page |
| `/submit-proposal`                     | Submit a project proposal            |
| `/proposal-status/[trackingToken]`     | Subcontractor proposal tracking page |

### Admin

| Route                                | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `/admin-login`                       | Magic-link login for `ADMIN_EMAIL`   |
| `/dashboard`                         | All submissions across modules       |
| `/dashboard/invoices/[id]`           | Invoice review + status + file       |
| `/dashboard/documents/[id]`          | Document review + status + files     |
| `/dashboard/proposals/[id]`          | Proposal review + status + files     |

### API

All `[id]/file` GETs and `[id]/status` PATCHes are admin-gated and use the
service role on the server. `POST /api/{invoices,documents,proposals}` are
public submission endpoints.

| Method | Route                                  | Notes                          |
| ------ | -------------------------------------- | ------------------------------ |
| POST   | `/api/invoices`                        | Public submit                  |
| GET    | `/api/invoices/[id]/file`              | Admin signed URL               |
| POST   | `/api/invoices/[id]/status`            | Admin form post (redirect)     |
| PATCH  | `/api/invoices/[id]/status`            | Admin JSON                     |
| POST   | `/api/documents`                       | Public submit                  |
| GET    | `/api/documents/[id]/file?field=...`   | Admin signed URL               |
| PATCH  | `/api/documents/[id]/status`           | Admin JSON                     |
| GET    | `/api/admin/documents/[id]`            | Legacy admin GET (still works) |
| POST   | `/api/proposals`                       | Public submit                  |
| GET    | `/api/proposals/[id]/file?index=N`     | Admin signed URL               |
| PATCH  | `/api/proposals/[id]/status`           | Admin JSON                     |
| GET    | `/auth/callback`                       | Supabase OAuth callback        |

## Local development

```bash
npm install
cp .env.example .env.local
# fill in your Supabase + admin values in .env.local
npm run dev
```

Then visit http://localhost:3000.

## Supabase setup

1. Create a free Supabase project.
2. Open the SQL Editor and run, in order:
   - `supabase/schema.sql`
   - `supabase/proposals-migration.sql`
3. In Storage, create a **private** bucket named `portal-files`.
4. Copy your project URL, anon key, and service role key into `.env.local`
   (and into Vercel for production — see env vars below).

## Environment variables

| Variable                       | Required        | Purpose                                                                 |
| ------------------------------ | --------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | yes             | Supabase project URL                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| yes             | Supabase anon key (used by the magic-link login)                        |
| `SUPABASE_SERVICE_ROLE_KEY`    | yes             | Used server-side to bypass RLS for inserts and signed URLs              |
| `ADMIN_EMAIL`                  | yes             | The ONLY email allowed into `/dashboard`                                |
| `EMAIL_PROVIDER`               | optional        | Explicit override: `smtp` \| `sendgrid` \| `resend`                     |
| `EMAIL_FROM`                   | when provider set | `Gol Homes Portal <portal@golhomes.com>` style address                |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | if SMTP | For SMTP2GO, Google Workspace SMTP, etc.                                |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | if SendGrid | If using SendGrid                                                       |
| `RESEND_API_KEY`               | if Resend       | If using Resend                                                         |

If no email provider is configured, the app still works — submissions and
status changes succeed, but no email is sent. A console warning is logged
each time so the operator knows email is currently off.

See `.env.example` for a copy-paste starting template.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repo. Use the default Next.js settings.
3. Add the env vars from the table above to **Project Settings → Environment Variables** (for both Production and Preview).
4. Trigger a deploy.

## Email provider notes (current blocker context)

The portal must keep working while the email provider question is unsettled.
Known constraints:

- **Resend** was attempted but blocked by DNS verification — Gol Homes DNS is
  managed by Wix, which does not support the subdomain MX setup Resend needs
  for a verified custom domain.
- **SendGrid** was considered but is a trial/paid path; we prefer free first.
- **SMTP2GO** has a free tier and works via the SMTP provider in this codebase.
- **Google Workspace SMTP** is also supported through the same SMTP provider
  (use `smtp.gmail.com`, port `587`, an app password).

To switch providers later, only the env vars change. The code does not need
to be touched. The order of resolution is:

1. SMTP if `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` set
2. SendGrid if `SENDGRID_API_KEY` set
3. Resend if `RESEND_API_KEY` set
4. Otherwise skip silently

## Handoff to Sajed / Gol Homes

Items Sajed will need to know:

- The admin login URL: `https://<your-vercel-domain>/admin-login`.
- The admin email is set in Vercel as `ADMIN_EMAIL` and must match the email
  used to log in. To change who is admin, edit that env var and redeploy.
- New projects can be added by inserting into the `projects` table in Supabase
  (set `is_active = true`). No code change needed.
- Proposal categories are hardcoded in `lib/proposal-categories.ts`. Edit and
  redeploy to add or rename categories.

## Known blockers / future work

- **Email provider:** see "Email provider notes" above.
- **Proposal categories admin UI:** deferred. Edit the file for now.
- **Per-file size limits:** Supabase Storage has a default 50 MB limit per
  file. If subs upload larger files, raise it in the bucket settings.
- **Audit log:** the `audit_logs` table is created but not yet written to.
  Adding write calls to the status update routes is a quick follow-up.

## Branch

This integration was developed on the `claude-preview-integration` branch.
Do not merge to `main` until `npm run build` passes locally and a Vercel
preview deploy looks correct.
