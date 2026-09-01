-- ============================================================
-- Trackr Supabase Schema (full)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Then also run: supabase/extensions.sql
-- ============================================================

-- ---------- PROFILES (extends built-in auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now()
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- PROJECTS ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- ---------- STATUSES ----------
create table if not exists statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  bg text not null,
  text_color text not null,
  icon text default '',
  is_fixed boolean not null default false,
  sort_order int not null default 0
);

-- ---------- SPRINTS ----------
create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  status text not null default 'future',
  start_date timestamptz,
  end_date timestamptz,
  goal text default '',
  created_at timestamptz default now()
);

-- ---------- ISSUES ----------
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  key text not null,
  type text not null default 'task',
  status_id uuid references statuses(id) on delete set null,
  priority text not null default 'medium',
  title text not null,
  description text default '',
  assignee_id uuid references profiles(id) on delete set null,
  reporter_id uuid references profiles(id) on delete set null,
  labels text[] default '{}',
  sprint_id uuid references sprints(id) on delete set null,
  epic_id uuid references issues(id) on delete set null,
  due_date timestamptz,
  story_points numeric,
  estimated_minutes int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- SUBTASKS ----------
create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  created_at timestamptz default now()
);

-- ---------- COMMENTS ----------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- TIME LOGS ----------
create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  minutes int not null,
  note text default '',
  log_date timestamptz default now(),
  subtask_id uuid references subtasks(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- ACTIVITY LOG ----------
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  from_value text,
  to_value text,
  created_at timestamptz default now()
);

-- See extensions.sql for attachments, issue_links, issue_watchers, storage, RLS helpers
