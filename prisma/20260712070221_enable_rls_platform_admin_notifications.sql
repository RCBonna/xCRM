alter table public.platform_admins enable row level security;
alter table public.notifications enable row level security;

drop policy if exists platform_admin_self_select on public.platform_admins;
drop policy if exists notification_recipient_select on public.notifications;

create policy platform_admin_self_select
on public.platform_admins
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  and status = 'ACTIVE'::public."RecordStatus"
);

create policy notification_recipient_select
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = notifications.recipient_user_id
      and u.auth_user_id = (select auth.uid())
      and u.status = 'ACTIVE'::public."RecordStatus"
  )
  or exists (
    select 1
    from public.platform_admins pa
    where pa.id = notifications.recipient_platform_admin_id
      and pa.auth_user_id = (select auth.uid())
      and pa.status = 'ACTIVE'::public."RecordStatus"
  )
);
