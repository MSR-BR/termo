-- Privacy-preserving, one-shot claim for accounts created after activation.
-- No trigger on auth.users: measurement can never block account creation.
-- Supabase's Cron module must be enabled by an authorized administrator first.
do $$ begin
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    raise exception 'pg_cron must be enabled before signup measurement migration';
  end if;
end $$;
create schema if not exists signup_measurement_private;
revoke all on schema signup_measurement_private from public, anon, authenticated;

create table if not exists signup_measurement_private.config (
  singleton boolean primary key default true check (singleton),
  activated_at timestamptz not null default now()
);
insert into signup_measurement_private.config(singleton) values (true) on conflict do nothing;
alter table signup_measurement_private.config enable row level security;
revoke all on table signup_measurement_private.config from public, anon, authenticated;

create table if not exists signup_measurement_private.claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table signup_measurement_private.claims enable row level security;
revoke all on table signup_measurement_private.claims from public, anon, authenticated;

-- Called by the client only after analytics opt-in. No ID is returned.
-- A recent account is not proof that this particular login created it; campaign
-- attribution and delivery coverage must be separately validated.
create or replace function public.claim_signup_measurement()
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_claimed uuid;
begin
  if v_user_id is null then return false; end if;
  insert into signup_measurement_private.claims(user_id)
    select u.id from auth.users u
    cross join signup_measurement_private.config c
    where u.id = v_user_id and u.is_anonymous is not true
      and u.created_at >= c.activated_at
      and u.created_at <= pg_catalog.now()
      and u.created_at >= pg_catalog.now() - interval '30 minutes'
    on conflict (user_id) do nothing
    returning user_id into v_claimed;
  return v_claimed is not null;
end;
$$;
revoke all on function public.claim_signup_measurement() from public, anon, authenticated;
grant execute on function public.claim_signup_measurement() to authenticated;

-- Read-only eligibility check for displaying an optional consent prompt.
create or replace function public.signup_measurement_available()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u cross join signup_measurement_private.config c
    where u.id = auth.uid() and u.is_anonymous is not true
      and u.created_at >= c.activated_at and u.created_at <= pg_catalog.now()
      and u.created_at >= pg_catalog.now() - interval '30 minutes'
      and not exists (select 1 from signup_measurement_private.claims r where r.user_id = u.id)
  );
$$;
revoke all on function public.signup_measurement_available() from public, anon, authenticated;
grant execute on function public.signup_measurement_available() to authenticated;

-- Claims are needed only during the 30-minute eligibility window. Hourly
-- cleanup removes receipts older than one hour, bounding routine retention.
select cron.schedule(
  'signup-measurement-claim-cleanup-v1',
  '0 * * * *',
  $job$delete from signup_measurement_private.claims where claimed_at < pg_catalog.now() - interval '1 hour'$job$
);
