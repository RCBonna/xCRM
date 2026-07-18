alter table "imports"
  add column if not exists "column_mapping" jsonb;

create table if not exists "import_mapping_templates" (
  "id" uuid primary key default gen_random_uuid(),
  "tenant_id" uuid not null references "tenants"("id") on delete cascade,
  "created_by_user_id" uuid references "users"("id"),
  "name" text not null,
  "mapping_json" jsonb not null,
  "status" "RecordStatus" not null default 'ACTIVE',
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null default current_timestamp
);

create unique index if not exists "import_mapping_templates_tenant_name_key"
  on "import_mapping_templates"("tenant_id", "name");

create index if not exists "import_mapping_templates_tenant_status_name_idx"
  on "import_mapping_templates"("tenant_id", "status", "name");
