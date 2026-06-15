alter table public.accounts
add column if not exists postal_code text,
add column if not exists address_number text,
add column if not exists address_complement text,
add column if not exists district text;
