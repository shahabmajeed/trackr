-- ============================================================
-- Trackr schema extensions (run AFTER the base schema)
-- Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Story points + estimate (minutes) on issues
alter table issues
  add column if not exists story_points numeric,
  add column if not exists estimated_minutes int;

-- Avatar on profiles
alter table profiles
  add column if not exists avatar_url text;

-- Time logs can target a subtask (nullable = issue-level log)
alter table time_logs
  add column if not exists subtask_id uuid references subtasks(id) on delete cascade;

-- ---------- ATTACHMENTS ----------
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_size int,
  mime_type text,
  created_at timestamptz default now()
);

-- ---------- ISSUE LINKS ----------
create table if not exists issue_links (
  id uuid primary key default gen_random_uuid(),
  source_issue_id uuid not null references issues(id) on delete cascade,
  target_issue_id uuid not null references issues(id) on delete cascade,
  link_type text not null, -- 'relates_to' | 'blocks' | 'is_blocked_by' | 'duplicates' | 'is_duplicated_by'
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  constraint issue_links_no_self check (source_issue_id <> target_issue_id),
  unique (source_issue_id, target_issue_id, link_type)
);

-- ---------- WATCHERS ----------
create table if not exists issue_watchers (
  issue_id uuid not null references issues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (issue_id, user_id)
);

-- RLS
alter table attachments enable row level security;
alter table issue_links enable row level security;
alter table issue_watchers enable row level security;

drop policy if exists "attachments readable by members" on attachments;
create policy "attachments readable by members" on attachments
  for select using (
    exists (select 1 from issues where issues.id = attachments.issue_id and is_project_member(issues.project_id))
  );
drop policy if exists "attachments writable by members" on attachments;
create policy "attachments writable by members" on attachments
  for all using (
    exists (select 1 from issues where issues.id = attachments.issue_id and is_project_member(issues.project_id))
  );

drop policy if exists "issue_links readable by members" on issue_links;
create policy "issue_links readable by members" on issue_links
  for select using (
    exists (select 1 from issues where issues.id = issue_links.source_issue_id and is_project_member(issues.project_id))
  );
drop policy if exists "issue_links writable by members" on issue_links;
create policy "issue_links writable by members" on issue_links
  for all using (
    exists (select 1 from issues where issues.id = issue_links.source_issue_id and is_project_member(issues.project_id))
  );

drop policy if exists "watchers readable by members" on issue_watchers;
create policy "watchers readable by members" on issue_watchers
  for select using (
    exists (select 1 from issues where issues.id = issue_watchers.issue_id and is_project_member(issues.project_id))
  );
drop policy if exists "watchers writable by members" on issue_watchers;
create policy "watchers writable by members" on issue_watchers
  for all using (
    exists (select 1 from issues where issues.id = issue_watchers.issue_id and is_project_member(issues.project_id))
  );

-- Allow users to insert their own profile row if trigger missed it
drop policy if exists "profiles insertable by self" on profiles;
create policy "profiles insertable by self" on profiles
  for insert with check (auth.uid() = id);

-- Storage bucket for issue attachments (public read; write via authenticated)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments storage read" on storage.objects;
create policy "attachments storage read" on storage.objects
  for select using (bucket_id = 'attachments');

drop policy if exists "attachments storage insert" on storage.objects;
create policy "attachments storage insert" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "attachments storage update" on storage.objects;
create policy "attachments storage update" on storage.objects
  for update using (bucket_id = 'attachments' and auth.role() = 'authenticated');

drop policy if exists "attachments storage delete" on storage.objects;
create policy "attachments storage delete" on storage.objects
  for delete using (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- ---------- RLS fix: first project create (owner can SELECT own row) ----------
drop policy if exists "projects readable by members" on projects;
create policy "projects readable by members" on projects
  for select using (
    auth.uid() = owner_id
    or is_project_member(id)
  );

drop policy if exists "projects insertable by authenticated" on projects;
create policy "projects insertable by authenticated" on projects
  for insert with check (auth.uid() = owner_id);

create or replace function handle_new_project() returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_created on projects;
create trigger on_project_created
  after insert on projects
  for each row execute procedure handle_new_project();

-- ---------- project_members RLS (needed for create + invite) ----------
drop policy if exists "members readable by project members" on project_members;
drop policy if exists "members insertable by project members" on project_members;
drop policy if exists "members insertable by self or members" on project_members;
drop policy if exists "members updatable by members" on project_members;
drop policy if exists "members updatable by project members" on project_members;
drop policy if exists "members deletable by members" on project_members;
drop policy if exists "members deletable by project members" on project_members;

create policy "members readable by project members" on project_members
  for select using (
    user_id = auth.uid()
    or is_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "members insertable by self or members" on project_members
  for insert with check (
    user_id = auth.uid()
    or is_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "members updatable by members" on project_members
  for update using (
    is_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "members deletable by members" on project_members
  for delete using (
    is_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Auto timer while In Progress
alter table issues
  add column if not exists timer_started_at timestamptz;

-- Jira-style parent/child (see also parent_subtasks.sql)
alter table issues
  add column if not exists parent_id uuid references issues(id) on delete cascade;

create index if not exists issues_parent_id_idx on issues(parent_id);

create or replace function prevent_nested_subtasks() returns trigger as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from issues where id = new.parent_id and parent_id is not null) then
      raise exception 'Cannot create a subtask under another subtask';
    end if;
    if new.parent_id = new.id then
      raise exception 'Issue cannot be its own parent';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_nested_subtasks on issues;
create trigger trg_prevent_nested_subtasks
  before insert or update of parent_id on issues
  for each row execute procedure prevent_nested_subtasks();
