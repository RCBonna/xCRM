alter type "RecordStatus" add value if not exists 'SUSPENDED';

create table if not exists platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  name text not null,
  email text not null unique,
  status "RecordStatus" not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_admins_status_idx
on platform_admins (status);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  recipient_user_id uuid references users(id) on delete cascade,
  recipient_platform_admin_id uuid references platform_admins(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_tenant_created_at_idx
on notifications (tenant_id, created_at);

create index if not exists notifications_recipient_user_read_created_idx
on notifications (recipient_user_id, read_at, created_at);

create index if not exists notifications_recipient_platform_admin_read_created_idx
on notifications (recipient_platform_admin_id, read_at, created_at);
