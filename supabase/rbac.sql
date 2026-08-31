-- ============================================================
-- RBAC: roles, member status, privileges, role defaults
-- Run in Supabase SQL Editor after schema + extensions
-- ============================================================

alter table project_members
  add column if not exists status text not null default 'active',
  add column if not exists privileges jsonb not null default '{}',
  add column if not exists role_label text default '';

alter table projects
  add column if not exists role_defaults jsonb not null default '{}';

-- Migrate legacy roles
update project_members set role = 'super_admin' where role in ('owner', 'super_admin');
update project_members set role = 'developer' where role in ('member', 'developer');
update project_members set role = 'manager' where role = 'manager';
update project_members set role = 'custom' where role = 'custom';
update project_members set role = 'developer' where role not in ('super_admin', 'admin', 'manager', 'developer', 'custom');

update project_members set status = 'active' where status is null or status = '';

-- ---------- membership helpers ----------
-- Keep parameter name pid (matches existing DB); CREATE OR REPLACE updates body without dropping policies.
create or replace function public.is_project_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
  )
  or exists (
    select 1 from projects p
    where p.id = pid and p.owner_id = auth.uid()
  );
$$;

create or replace function public.is_active_project_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from project_members pm
    where pm.project_id = pid
      and pm.user_id = auth.uid()
      and pm.status = 'active'
  )
  or exists (
    select 1 from projects p
    where p.id = pid and p.owner_id = auth.uid()
  );
$$;

-- Owner row on new project
create or replace function handle_new_project() returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role, status)
  values (new.id, new.owner_id, 'super_admin', 'active')
  on conflict (project_id, user_id) do update
    set role = 'super_admin', status = 'active';
  return new;
end;
$$ language plpgsql security definer;

-- ---------- projects: inactive can read, only active can write ----------
drop policy if exists "projects updatable by members" on projects;
create policy "projects updatable by members" on projects
  for update using (
    auth.uid() = owner_id
    or is_active_project_member(id)
  );

drop policy if exists "scope files writable by members" on project_scope_files;
create policy "scope files writable by members" on project_scope_files
  for all using (is_active_project_member(project_id))
  with check (is_active_project_member(project_id));

-- issues / sprints / statuses / comments / time_logs — enable RLS if missing and gate writes
alter table issues enable row level security;
alter table sprints enable row level security;
alter table statuses enable row level security;
alter table comments enable row level security;
alter table time_logs enable row level security;
alter table subtasks enable row level security;
alter table activity_log enable row level security;

drop policy if exists "issues readable by members" on issues;
create policy "issues readable by members" on issues
  for select using (is_project_member(project_id));

drop policy if exists "issues writable by active members" on issues;
create policy "issues writable by active members" on issues
  for all using (is_active_project_member(project_id))
  with check (is_active_project_member(project_id));

drop policy if exists "sprints readable by members" on sprints;
create policy "sprints readable by members" on sprints
  for select using (is_project_member(project_id));

drop policy if exists "sprints writable by active members" on sprints;
create policy "sprints writable by active members" on sprints
  for all using (is_active_project_member(project_id))
  with check (is_active_project_member(project_id));

drop policy if exists "statuses readable by members" on statuses;
create policy "statuses readable by members" on statuses
  for select using (is_project_member(project_id));

drop policy if exists "statuses writable by active members" on statuses;
create policy "statuses writable by active members" on statuses
  for all using (is_active_project_member(project_id))
  with check (is_active_project_member(project_id));

drop policy if exists "comments readable by members" on comments;
create policy "comments readable by members" on comments
  for select using (
    exists (select 1 from issues i where i.id = issue_id and is_project_member(i.project_id))
  );

drop policy if exists "comments writable by active members" on comments;
create policy "comments writable by active members" on comments
  for all using (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  )
  with check (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  );

drop policy if exists "time_logs readable by members" on time_logs;
create policy "time_logs readable by members" on time_logs
  for select using (
    exists (select 1 from issues i where i.id = issue_id and is_project_member(i.project_id))
  );

drop policy if exists "time_logs writable by active members" on time_logs;
create policy "time_logs writable by active members" on time_logs
  for all using (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  )
  with check (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  );

drop policy if exists "subtasks readable by members" on subtasks;
create policy "subtasks readable by members" on subtasks
  for select using (
    exists (select 1 from issues i where i.id = issue_id and is_project_member(i.project_id))
  );

drop policy if exists "subtasks writable by active members" on subtasks;
create policy "subtasks writable by active members" on subtasks
  for all using (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  )
  with check (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  );

drop policy if exists "activity readable by members" on activity_log;
create policy "activity readable by members" on activity_log
  for select using (
    exists (select 1 from issues i where i.id = issue_id and is_project_member(i.project_id))
  );

drop policy if exists "activity writable by active members" on activity_log;
create policy "activity writable by active members" on activity_log
  for all using (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  )
  with check (
    exists (select 1 from issues i where i.id = issue_id and is_active_project_member(i.project_id))
  );

-- attachments / links / watchers
drop policy if exists "attachments writable by members" on attachments;
create policy "attachments writable by members" on attachments
  for all using (
    exists (select 1 from issues where issues.id = attachments.issue_id and is_active_project_member(issues.project_id))
  )
  with check (
    exists (select 1 from issues where issues.id = attachments.issue_id and is_active_project_member(issues.project_id))
  );

drop policy if exists "issue_links writable by members" on issue_links;
create policy "issue_links writable by members" on issue_links
  for all using (
    exists (select 1 from issues where issues.id = issue_links.source_issue_id and is_active_project_member(issues.project_id))
  )
  with check (
    exists (select 1 from issues where issues.id = issue_links.source_issue_id and is_active_project_member(issues.project_id))
  );

drop policy if exists "watchers writable by members" on issue_watchers;
create policy "watchers writable by members" on issue_watchers
  for all using (
    exists (select 1 from issues where issues.id = issue_watchers.issue_id and is_active_project_member(issues.project_id))
  )
  with check (
    exists (select 1 from issues where issues.id = issue_watchers.issue_id and is_active_project_member(issues.project_id))
  );

-- project_members: SA can manage via app; keep existing policies but writes require active
drop policy if exists "members updatable by members" on project_members;
create policy "members updatable by members" on project_members
  for update using (
    is_active_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "members deletable by members" on project_members;
create policy "members deletable by members" on project_members
  for delete using (
    is_active_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "members insertable by self or members" on project_members;
create policy "members insertable by self or members" on project_members
  for insert with check (
    user_id = auth.uid()
    or is_active_project_member(project_id)
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );
