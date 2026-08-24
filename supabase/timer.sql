-- Auto timer while status is In Progress
-- Run in Supabase → SQL Editor

alter table issues
  add column if not exists timer_started_at timestamptz;
