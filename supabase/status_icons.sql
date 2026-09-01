-- Workflow status icons (Material UI icon names)
alter table statuses add column if not exists icon text default '';

update statuses set icon = 'RadioButtonUnchecked' where lower(label) = 'to do' and (icon is null or icon = '');
update statuses set icon = 'Replay' where lower(label) = 'reopen' and (icon is null or icon = '');
update statuses set icon = 'Autorenew' where lower(label) = 'in progress' and (icon is null or icon = '');
update statuses set icon = 'CheckCircle' where lower(label) = 'done' and (icon is null or icon = '');
