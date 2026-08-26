-- ============================================================
-- Scope Files: titles, descriptions, labels, external links
-- Run after project_scope.sql
-- ============================================================

alter table project_scope_files
  alter column file_path drop not null;

alter table project_scope_files
  add column if not exists title text default '',
  add column if not exists description text default '',
  add column if not exists labels text[] default '{}',
  add column if not exists link_url text,
  add column if not exists file_type text default 'document',
  add column if not exists collection text default 'client', -- reference (handover/scope) | client (ongoing)
  add column if not exists updated_at timestamptz default now();

-- Backfill titles from file names where empty
update project_scope_files
set title = coalesce(nullif(title, ''), file_name)
where coalesce(title, '') = '';

update project_scope_files
set collection = 'client'
where collection is null;
