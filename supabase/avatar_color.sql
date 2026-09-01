-- Profile initials color (one of 7 preset hex values)
alter table profiles add column if not exists avatar_color text;
