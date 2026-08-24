-- ============================================================
-- Fix: first project create fails with RLS 42501
-- Cause: INSERT returns the row via SELECT, but SELECT only
-- allows members — and you're not a member until after insert.
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Owners can always read their own projects (needed for INSERT … RETURNING)
drop policy if exists "projects readable by members" on projects;
create policy "projects readable by members" on projects
  for select using (
    auth.uid() = owner_id
    or is_project_member(id)
  );

-- Ensure insert policy exists
drop policy if exists "projects insertable by authenticated" on projects;
create policy "projects insertable by authenticated" on projects
  for insert with check (auth.uid() = owner_id);

-- Auto-add creator as owner member (so statuses/issues RLS works immediately)
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
