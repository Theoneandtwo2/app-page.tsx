# Gol Homes Portal — Free Supabase/Vercel Starter

Free-first Prototype 1 for Gol Homes subcontractor portal.

## Free-first architecture
- App: Next.js / React / TypeScript
- Styling: Tailwind CSS
- Hosting: Vercel Hobby
- Database: Supabase Postgres
- Auth: Supabase magic link login
- File storage: Supabase Storage
- Reporting/export: Google Sheets API later
- AI invoice parsing: later, not in Prototype 1
- E-signature: keep Google eSignature manually/linked for now

## Prototype 1 scope
- Email magic-link login
- Admin dashboard shell
- Invoice submission form
- Private invoice upload to Supabase Storage
- Database table schema for invoices/projects/profiles/files/cost codes
- Admin invoice review table shell

## Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup
1. Create a free Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Create a private Storage bucket named `portal-files`.
5. Copy your project URL and anon key into `.env.local`.

## Deploy
Push to GitHub, then import the repo into Vercel.
Add the same environment variables in Vercel project settings.
