-- Gol Homes Portal free-first Supabase schema
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique,
  email text unique not null,
  role text not null default 'subcontractor' check (role in ('admin', 'reviewer', 'read_only', 'subcontractor')),
  company_name text,
  contact_name text,
  phone text,
  trade text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

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

create table if not exists cost_codes (
  id uuid primary key default uuid_generate_v4(),
  cost_code text,
  category text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into cost_codes (cost_code, category, description) values
  ('TBD', 'Brick Material', 'Placeholder pending Sajed confirmation'),
  ('TBD', 'Electrical', 'Placeholder pending Sajed confirmation'),
  ('TBD', 'Plumbing', 'Placeholder pending Sajed confirmation'),
  ('TBD', 'Framing', 'Placeholder pending Sajed confirmation')
on conflict do nothing;

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  project_name text not null,
  company_name text not null,
  contact_name text not null,
  invoice_amount numeric(12,2) not null,
  invoice_number text,
  invoice_date date not null,
  lien_waiver_accepted boolean not null default false,
  invoice_status text not null default 'pending_review' check (invoice_status in ('pending_review', 'incomplete', 'approved', 'rejected', 'paid')),
  file_path text,
  ai_extraction_status text not null default 'not_processed' check (ai_extraction_status in ('not_processed', 'processed', 'needs_review', 'approved')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text
);

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

alter table profiles enable row level security;
alter table projects enable row level security;
alter table cost_codes enable row level security;
alter table invoices enable row level security;
alter table audit_logs enable row level security;

create policy "Authenticated users can view active projects" on projects for select to authenticated using (is_active = true);
create policy "Authenticated users can view cost codes" on cost_codes for select to authenticated using (is_active = true);
create policy "Authenticated users can insert invoices" on invoices for insert to authenticated with check (true);
create policy "Authenticated users can view invoices in prototype" on invoices for select to authenticated using (true);

-- Storage bucket creation in Supabase dashboard:
-- Bucket name: portal-files
-- Public bucket: OFF
