-- ============================================================
-- Fix: project_members RLS on first project create
-- Run in Supabase → SQL Editor
-- ============================================================

-- Recreate member policies (select / insert / update / delete)
drop policy if exists "members readable by project members" on project_members;
drop policy if exists "members insertable by project members" on project_members;
drop policy if exists "members updatable by project members" on project_members;
drop policy if exists "members deletable by project members" on project_members;

create policy "members readable by project members" on project_members
  for select using (
    user_id = auth.uid()
    or is_project_member(project_id)
    or exists (
      select 1 from projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- Anyone can add themselves; existing members can invite others
create policy "members insertable by self or members" on project_members
  for insert with check (
    user_id = auth.uid()
    or is_project_member(project_id)
    or exists (
      select 1 from projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "members updatable by members" on project_members
  for update using (
    is_project_member(project_id)
    or exists (
      select 1 from projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "members deletable by members" on project_members
  for delete using (
    is_project_member(project_id)
    or exists (
      select 1 from projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- Keep auto-add owner trigger (security definer bypasses RLS)
create or replace function handle_new_project() returns trigger as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_project_created on projects;
create trigger on_project_created
  after insert on projects
  for each row execute procedure handle_new_project();
