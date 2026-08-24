-- ============================================================
-- Issue hierarchy validation (Epic → Story/Task/Bug → Subtask)
-- Run in Supabase → SQL Editor after parent_subtasks.sql
-- ============================================================

create or replace function prevent_invalid_issue_hierarchy() returns trigger as $$
declare
  parent_type text;
  parent_parent uuid;
begin
  if new.id is not null and new.parent_id = new.id then
    raise exception 'Issue cannot be its own parent';
  end if;

  if new.parent_id is not null then
    select type, parent_id into parent_type, parent_parent
    from issues where id = new.parent_id;

    if parent_type is null then
      raise exception 'Parent issue not found';
    end if;

    if parent_type = 'subtask' then
      raise exception 'Subtasks cannot have children';
    end if;

    if parent_type = 'epic' and new.type not in ('story', 'task', 'bug') then
      raise exception 'Epics can only contain stories, tasks, or bugs';
    end if;

    if parent_type = 'story' and new.type not in ('task', 'bug') then
      raise exception 'Stories can only contain tasks or bugs';
    end if;

    if parent_type in ('task', 'bug') and new.type <> 'subtask' then
      raise exception 'Tasks and bugs can only contain subtasks';
    end if;
  elsif new.type = 'subtask' then
    raise exception 'Subtasks must have a parent task or bug';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_nested_subtasks on issues;
drop trigger if exists trg_prevent_invalid_hierarchy on issues;

create trigger trg_prevent_invalid_hierarchy
  before insert or update of parent_id, type on issues
  for each row execute procedure prevent_invalid_issue_hierarchy();
