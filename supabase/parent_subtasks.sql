-- ============================================================
-- Jira-style subtasks: child issues linked via parent_id
-- Run in Supabase → SQL Editor
-- ============================================================

alter table issues
  add column if not exists parent_id uuid references issues(id) on delete cascade;

create index if not exists issues_parent_id_idx on issues(parent_id);

-- Block nesting: a subtask cannot be someone else's parent
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
