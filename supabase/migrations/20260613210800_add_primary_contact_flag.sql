alter table public.contacts
add column if not exists is_primary boolean not null default false;

with ranked_contacts as (
  select
    id,
    row_number() over (
      partition by tenant_id, account_id
      order by created_at asc, id asc
    ) as position
  from public.contacts
)
update public.contacts as contacts
set is_primary = ranked_contacts.position = 1
from ranked_contacts
where contacts.id = ranked_contacts.id;

create unique index if not exists contacts_one_primary_per_account
on public.contacts (tenant_id, account_id)
where is_primary;
