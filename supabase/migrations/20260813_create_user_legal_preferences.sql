create table if not exists public.user_legal_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  privacy_acknowledged_at timestamptz,
  email_updates_opted_in boolean not null default true,
  email_updates_opted_in_at timestamptz,
  email_updates_opted_out_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_legal_preferences_terms_pair_check check (
    (terms_version is null) = (terms_accepted_at is null)
  ),
  constraint user_legal_preferences_privacy_pair_check check (
    (privacy_version is null) = (privacy_acknowledged_at is null)
  )
);

create or replace function public.set_user_legal_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_legal_preferences_set_updated_at on public.user_legal_preferences;
create trigger user_legal_preferences_set_updated_at
before update on public.user_legal_preferences
for each row execute function public.set_user_legal_preferences_updated_at();

alter table public.user_legal_preferences enable row level security;

revoke all on public.user_legal_preferences from anon, authenticated;
grant select, insert, update on public.user_legal_preferences to service_role;
