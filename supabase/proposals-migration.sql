-- ============================================================================
-- Gol Homes Portal — Proposals module migration
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor BEFORE the proposal module is used in
-- production. Safe to run multiple times (idempotent).
--
-- The proposal module pages (/submit-proposal,
-- /proposal-status/[trackingToken], /dashboard/proposals/[id]) and the
-- proposal API routes (/api/proposals/*) won't function until this is run.
--
-- File uploads go into the existing `portal-files` private bucket under the
-- path proposals/<safeCompany>/<timestamp>-<index>-<filename>. No additional
-- bucket is needed.
-- ============================================================================

create extension if not exists "uuid-ossp";

create table if not exists proposals (
  id uuid primary key default uuid_generate_v4(),
  submitter_email text not null,
  company_name text not null,
  contact_name text,
  proposal_category text not null,
  project_address text not null,
  price numeric(12,2) not null,
  option_price numeric(12,2),
  soonest_start_date date,
  duration text,
  file_paths jsonb not null default '[]'::jsonb,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'incomplete', 'missing_info')),
  tracking_token text unique not null,
  admin_notes text,
  reviewed_by_email text,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_tracking_token_idx on proposals (tracking_token);
create index if not exists proposals_status_idx on proposals (status);
create index if not exists proposals_submitted_at_idx on proposals (submitted_at desc);

-- Keep updated_at fresh on every UPDATE.
create or replace function set_proposals_updated_at()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

drop trigger if exists proposals_set_updated_at on proposals;
create trigger proposals_set_updated_at
  before update on proposals
  for each row execute function set_proposals_updated_at();

-- RLS: enabled but no policies. All access goes through service role on the
-- server (same pattern as invoices/documents).
alter table proposals enable row level security;
