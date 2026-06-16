alter table teams
add column if not exists status "RecordStatus" not null default 'ACTIVE';
