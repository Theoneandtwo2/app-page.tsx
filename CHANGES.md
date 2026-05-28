# Claude Preview Integration — change summary

Branch: `claude-preview-integration`
Goal: integrate the redesigned Manus preview design into the existing
Next.js/Supabase portal **without** breaking the working backend, plus add the
new proposal module and a provider-flexible email helper.

---

## How to apply this on your GitHub repo

This work was done in the Cowork workspace at
`C:\Users\gman0\OneDrive\Documents\Claude\Projects\Invoice-app`. To get it
onto your GitHub repo, you have two options:

**Option A — copy the working tree (simplest).**

```bash
git clone https://github.com/Theoneandtwo2/invoice-portal.git
cd invoice-portal
git checkout -b claude-preview-integration
# Copy every file from the Invoice-app folder OVER the repo files
# (the .git directory in the Invoice-app folder may be stale — ignore it).
# On Windows in PowerShell:
robocopy "C:\Users\gman0\OneDrive\Documents\Claude\Projects\Invoice-app" . /E /XD .git node_modules .next .preview /XF gol-preview.zip claude-preview-integration.patch CHANGES.md
npm install
npm run build
git add -A
git commit -m "feat: integrate Manus preview design + add proposal module + email helper"
git push origin claude-preview-integration
```

**Option B — apply the patch file.**

```bash
git clone https://github.com/Theoneandtwo2/invoice-portal.git
cd invoice-portal
git checkout -b claude-preview-integration
git apply --reject --whitespace=fix claude-preview-integration.patch
npm install
npm run build
git add -A
git commit -m "feat: integrate Manus preview design + add proposal module + email helper"
git push origin claude-preview-integration
```

(The patch file is in the Invoice-app folder. Inspect any `.rej` files if
the patch can't apply cleanly — most likely cause would be a stale baseline.)

**Do NOT merge to `main` until `npm run build` passes locally and a Vercel
preview deploy looks right.**

---

## Build status

I could not run `npm install` / `npm run build` inside the Cowork sandbox —
the sandbox's network policy blocks the npm registry (HTTP 403). I did a
thorough **static** review instead:

- ✅ All Next 15 dynamic routes use `params: Promise<{...}>` + `await params`.
- ✅ Every client component begins with `"use client"`.
- ✅ All `@/*` path-alias imports resolve to existing files.
- ✅ JSON files (`package.json`, `tsconfig.json`) parse.
- ✅ Backticks in `lib/email/templates.ts` balanced.
- ✅ No remaining `<style jsx global>` — form input styles moved into
  `app/globals.css` as a `.form-input` class component layer to avoid any
  styled-jsx ambiguity.
- ✅ Tailwind class names match `tailwind.config.ts` extensions (`gol.green`,
  `gol-soft`, `card`, `card-sm`, `card-hover`, `eyebrow`, `2xs`).

**You should still run `npm run build` locally before merging.** If any
errors appear, send me the output and I'll fix them.

---

## Decisions confirmed and implemented

1. `/dashboard/documents/[id]` converted to a server component.
2. Confirmation copy: "Submission received. Please check your email for your
   status link." + "If you do not receive the email, save this backup link."
3. Invoice and proposal forms pull from `projects` table (active only),
   fallback to a hardcoded list if Supabase is unreachable.
4. Proposal categories hardcoded in `lib/proposal-categories.ts`.
5. **No admin link on the public homepage.** Reachable only at `/admin-login`.
6. `/login` and `/my-invoices` converted to redirect stubs that bounce to `/`.
7. Admin access still gated by `ADMIN_EMAIL`.
8. All file access remains private, admin-only, 60-second signed URLs.
9. Email is provider-flexible (SMTP → SendGrid → Resend → safe skip).

---

## Files changed / added

### New files

**Components (`components/`)**
- `BrandHeader.tsx` — GOL logo + company name + subtitle. Used on every public page.
- `AdminNav.tsx` — sticky nav for `/dashboard/*` with logo, current admin email, sign-out.
- `SignOutButton.tsx` — client component that calls Supabase signOut.
- `StatusBadge.tsx` — typed badge + `StatusHero` block. Handles all status keys.
- `DetailRow.tsx` — label/value row used on tracking and review pages.
- `ConfirmationCard.tsx` — shared submission confirmation panel (email-primary, link-backup).

**Library (`lib/`)**
- `email/send.ts` — provider-flexible email helper (SMTP / SendGrid / Resend / safe skip).
- `email/templates.ts` — HTML email templates for all 6 events (3 modules × received/updated).
- `projects.ts` — fetch active projects from Supabase with fallback list.
- `proposal-categories.ts` — hardcoded category list for v1.

**Proposal module — new feature (`app/`)**
- `submit-proposal/page.tsx` + `submit-proposal/ProposalFormClient.tsx` — public form (up to 5 files).
- `proposal-status/[trackingToken]/page.tsx` — public tracking page.
- `dashboard/proposals/[id]/page.tsx` + `ProposalStatusActions.tsx` + `ProposalFileButton.tsx` — admin review.
- `api/proposals/route.ts` — POST: validate, upload files, insert, email.
- `api/proposals/[id]/file/route.ts` — admin signed URL (by file index).
- `api/proposals/[id]/status/route.ts` — admin PATCH status + notes + email.

**Other**
- `app/not-found.tsx` — friendly 404 page with GOL branding.
- `app/error.tsx` — friendly error boundary.
- `supabase/proposals-migration.sql` — proposals table + indexes + RLS.
- `.env.example` — copy-paste env template with all variables documented.
- `CHANGES.md` — this file.
- `claude-preview-integration.patch` — unified diff vs. baseline for `git apply`.

### Modified files

| File                                       | What changed                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `app/layout.tsx`                           | Title, description, favicon, Geist font, body class                         |
| `app/globals.css`                          | Geist import, GOL background, `.focus-ring`, `.form-input`, file-input styles |
| `app/page.tsx`                             | Full redesign — 3 action cards, no admin link, GOL branding                 |
| `app/admin-login/page.tsx`                 | Full redesign + "login link sent" state                                     |
| `app/invoices/new/page.tsx`                | Now a thin server component that fetches projects                           |
| `app/invoices/new/InvoiceFormClient.tsx`   | New file — client form, confirmation card on success                        |
| `app/invoice-status/[trackingToken]/page.tsx` | Full redesign — StatusHero, DetailRow, admin notes block                   |
| `app/dashboard/invoices/[id]/page.tsx`     | Full redesign — two-column layout, AdminNav                                 |
| `app/dashboard/invoices/[id]/InvoiceStatusActions.tsx` | New — 4 status buttons + notes; emails via helper             |
| `app/dashboard/invoices/[id]/ViewFileButton.tsx` | Restyled (logic unchanged)                                            |
| `app/api/invoices/route.ts`                | Switched Resend → email helper; uses new template; uses `submitted_at`      |
| `app/api/invoices/[id]/status/route.ts`    | Adds `adminNotes`; supports both POST (form) and PATCH (JSON); helper email |
| `app/api/invoices/[id]/file/route.ts`      | Light cleanup; logic unchanged                                              |
| `app/submit-documents/page.tsx`            | Full redesign — friendlier copy, uses ConfirmationCard on success           |
| `app/document-status/[trackingToken]/page.tsx` | Full redesign — StatusHero, DetailRow, file list, admin notes           |
| `app/dashboard/documents/[id]/page.tsx`    | **Converted to server component** (was useEffect-based); new layout          |
| `app/dashboard/documents/[id]/DocumentStatusActions.tsx` | New client component for status + notes                       |
| `app/dashboard/documents/[id]/DocFileButton.tsx` | New client component for opening signed URLs                          |
| `app/api/documents/route.ts`               | Switched to email helper; new template                                      |
| `app/api/documents/[id]/status/route.ts`   | **Now sends a status-change email** (previously didn't); email helper       |
| `app/api/documents/[id]/file/route.ts`     | Light cleanup; logic unchanged                                              |
| `app/api/admin/documents/[id]/route.ts`    | PATCH removed (consolidated into `/status`); GET retained for legacy        |
| `app/login/page.tsx`                       | Converted to redirect stub (`/login` → `/`)                                 |
| `app/my-invoices/page.tsx`                 | Converted to redirect stub (`/my-invoices` → `/`)                           |
| `app/dashboard/page.tsx`                   | Full redesign — stat cards, 3 tables, gracefully handles missing proposals table |
| `tailwind.config.ts`                       | Full GOL palette, Geist font, `card`/`card-sm` radii, custom shadows         |
| `package.json`                             | Added `nodemailer` + `@types/nodemailer`                                    |
| `supabase/schema.sql`                      | Rewritten to match production reality (additive `add column if not exists`)  |
| `README.md`                                | Full rewrite — routes, env vars, deploy, email options, known blockers      |
| `.gitignore`                               | Added `.preview/` and `gol-preview.zip` lines                               |

### Unchanged

- `next.config.ts`
- `tsconfig.json`
- `postcss.config.js`
- `app/auth/callback/route.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

---

## What to do BEFORE merging to `main`

1. **Run the migrations** in the Supabase SQL Editor:
   - `supabase/schema.sql` (idempotent — safe to re-run)
   - `supabase/proposals-migration.sql` (new — required for proposal module)
2. **Set env vars in Vercel** (see `.env.example` for the full list).
3. `npm install` locally, then `npm run build`. **Build must pass.**
4. Push the branch and let Vercel build a preview deploy.
5. Walk through the smoke test on the preview deploy:
   - Homepage loads (no admin link visible).
   - Invoice form submits → confirmation card → email arrives (or warning logged) → status page shows pending.
   - Documents form submits → same flow.
   - Proposal form submits → same flow.
   - `/admin-login` → magic link → `/dashboard` shows the new submissions.
   - Admin can View File (opens signed URL), Approve/Mark Paid/etc. (status updates + emails sent), Save Notes.
   - The wrong email gets the "Access denied" card on `/dashboard`.
6. If smoke test passes, merge the branch into `main`.

---

## Known follow-ups (not blocking ship)

- **Email provider:** the helper supports SMTP/SendGrid/Resend out of the box;
  set env vars when you've picked one. SMTP2GO is the recommended free path
  given the Wix-DNS / Resend domain-verification blocker.
- **Audit log:** `audit_logs` table exists but isn't written to yet. Easy
  follow-up: instrument the status-update routes.
- **Proposal categories admin:** deferred. Edit `lib/proposal-categories.ts`
  to add/rename categories.

