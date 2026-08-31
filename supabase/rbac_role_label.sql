-- Custom role display name (QA, Tester, SEO, etc.) — run after rbac.sql
alter table project_members
  add column if not exists role_label text default '';
