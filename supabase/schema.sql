-- ============================================================================
-- Gol Homes Portal — Supabase schema (consolidated, idempotent)
-- ----------------------------------------------------------------------------
-- This file is the canonical schema for the Gol Homes Subcontractor Portal,
-- consolidated from the original starter + the columns added live in the
-- Supabase dashboard for the public-no-account flow.
--
-- Safe to re-run: every `create table` is `if not exists`, every `alter table`
-- adds columns with `if not exists`.
--
-- Order of operations for a NEW Supabase project:
--   1. Run this file (supabase/schema.sql).
--   2. Run supabase/proposals-migration.sql.
--   3. Create a PRIVATE storage bucket named `portal-files`.
--   4. Add the env vars from .env.example to Vercel.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- projects
--   Populates the Project dropdown on invoice and proposal forms.
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  project_name text not null,
  project_address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into projects (project_name, project_address) values
  ('2757 Nelson', '2757 Nelson'),
  ('2767 Nelson', '2767 Nelson'),
  ('6004 Balsam', '6004 Balsam'),
  ('5914 Woodley', '5914 Woodley')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- invoices
-- ----------------------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  project_name text not null,
  company_name text not null,
  contact_name text not null,
  invoice_amount numeric(12,2) not null,
  invoice_number text,
  invoice_date date not null,
  lien_waiver_accepted boolean not null default false,
  invoice_status text not null default 'pending_review'
    check (invoice_status in ('pending_review', 'incomplete', 'approved', 'rejected', 'paid')),
  file_path text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text
);

-- Columns added live for the public-no-account flow:
alter table invoices add column if not exists submitter_email text;
alter table invoices add column if not exists tracking_token text;
alter table invoices add column if not exists original_file_name text;
alter table invoices add column if not exists file_size bigint;
alter table invoices add column if not exists reviewed_by_email text;
alter table invoices add column if not exists admin_notes text;

create unique index if not exists invoices_tracking_token_uidx on invoices (tracking_token);
create index if not exists invoices_status_idx on invoices (invoice_status);
create index if not exists invoices_submitted_at_idx on invoices (submitted_at desc);

-- ----------------------------------------------------------------------------
-- documents (W-9 / COI / EIN / business license)
-- ----------------------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  contact_name text not null,
  submitter_email text not null,
  document_types text not null,
  file_paths text not null,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'missing_info')),
  tracking_token text unique not null,
  admin_notes text,
  reviewed_by text,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_tracking_token_idx on documents (tracking_token);
create index if not exists documents_status_idx on documents (status);
create index if not exists documents_uploaded_at_idx on documents (uploaded_at desc);

-- ----------------------------------------------------------------------------
-- audit_logs (reserved for future use)
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  action text not null,
  module text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The anon key is never used for user-facing reads or writes that touch
-- private data. All public form posts and tracking page reads run through
-- API routes using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. RLS is
-- enabled with no policies so the anon key cannot read private rows.
-- ============================================================================
alter table projects enable row level security;
alter table invoices enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'projects_public_read') then
    create policy projects_public_read on projects for select using (true);
  end if;
end$$;

-- ============================================================================
-- Storage bucket reminder:
--   Create a PRIVATE bucket named `portal-files` from the Supabase dashboard.
--   File paths used by the app:
--     invoices/<safeProject>/<safeCompany>/<timestamp>-<filename>
--     documents/<safeCompany>/<field>/<timestamp>-<filename>
--     proposals/<safeCompany>/<timestamp>-<index>-<filename>
--   Files are only ever served through admin-only 60-second signed URLs.
-- ============================================================================
