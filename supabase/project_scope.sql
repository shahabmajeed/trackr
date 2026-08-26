-- ============================================================
-- Project Scope: brief, client details, and scope files
-- Run in Supabase → SQL Editor
-- ============================================================

alter table projects
  add column if not exists description_html text default '',
  add column if not exists website_url text default '',
  add column if not exists platform text default '',
  add column if not exists cover_image_url text,
  add column if not exists client_name text default '',
  add column if not exists client_email text default '',
  add column if not exists client_source text default '',
  add column if not exists client_website text default '',
  add column if not exists client_image_url text,
  add column if not exists updated_at timestamptz default now();

create table if not exists project_scope_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  file_name text not null,
  file_path text,
  file_size int,
  mime_type text,
  kind text not null default 'document', -- document | image | link
  title text default '',
  description text default '',
  labels text[] default '{}',
  link_url text,
  file_type text default 'document', -- pdf | word | image | link | google_doc | google_sheet | document
  collection text default 'client', -- reference (handover/scope) | client (ongoing)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists project_scope_files_project_id_idx on project_scope_files(project_id);

alter table project_scope_files enable row level security;

drop policy if exists "scope files readable by members" on project_scope_files;
create policy "scope files readable by members" on project_scope_files
  for select using (is_project_member(project_id));

drop policy if exists "scope files writable by members" on project_scope_files;
create policy "scope files writable by members" on project_scope_files
  for all using (is_project_member(project_id))
  with check (is_project_member(project_id));

drop policy if exists "projects updatable by members" on projects;
create policy "projects updatable by members" on projects
  for update using (
    auth.uid() = owner_id
    or is_project_member(id)
  );
