create table if not exists public.simulator_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  simulator_id text not null,
  simulator_slug text not null,
  simulator_title text not null,
  simulator_path text not null,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  open_count bigint not null default 1,
  primary key (user_id, simulator_id),
  constraint simulator_activity_id_check check (simulator_id ~ '^S[0-9]{2}$'),
  constraint simulator_activity_slug_check check (simulator_slug ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  constraint simulator_activity_title_check check (char_length(simulator_title) between 1 and 160),
  constraint simulator_activity_path_check check (
    simulator_path = 'simulators/' || simulator_slug || '.html'
  ),
  constraint simulator_activity_open_count_check check (open_count > 0),
  constraint simulator_activity_time_order_check check (last_opened_at >= first_opened_at)
);

create index if not exists simulator_activity_user_last_opened_idx
  on public.simulator_activity (user_id, last_opened_at desc);

alter table public.simulator_activity enable row level security;

revoke all on table public.simulator_activity from public, anon, authenticated;
grant select on table public.simulator_activity to authenticated;
grant select, insert, update, delete on table public.simulator_activity to service_role;

drop policy if exists "Users can view their own simulator activity" on public.simulator_activity;
create policy "Users can view their own simulator activity"
  on public.simulator_activity
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
    and (select auth.uid()) = user_id
  );

create or replace function public.record_simulator_open(
  p_simulator_id text,
  p_simulator_slug text,
  p_simulator_title text,
  p_simulator_path text
)
returns public.simulator_activity
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_activity public.simulator_activity;
begin
  if v_user_id is null
    or coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'true'
  then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_simulator_id is null or p_simulator_id !~ '^S[0-9]{2}$' then
    raise exception 'Invalid simulator id.' using errcode = '22023';
  end if;

  if p_simulator_slug is null or p_simulator_slug !~ '^[a-z0-9][a-z0-9_-]{0,79}$' then
    raise exception 'Invalid simulator slug.' using errcode = '22023';
  end if;

  if p_simulator_title is null or char_length(trim(p_simulator_title)) not between 1 and 160 then
    raise exception 'Invalid simulator title.' using errcode = '22023';
  end if;

  if p_simulator_path is null
    or p_simulator_path <> 'simulators/' || p_simulator_slug || '.html'
  then
    raise exception 'Invalid simulator path.' using errcode = '22023';
  end if;

  insert into public.simulator_activity (
    user_id,
    simulator_id,
    simulator_slug,
    simulator_title,
    simulator_path
  ) values (
    v_user_id,
    p_simulator_id,
    p_simulator_slug,
    trim(p_simulator_title),
    p_simulator_path
  )
  on conflict (user_id, simulator_id) do update
  set simulator_slug = excluded.simulator_slug,
      simulator_title = excluded.simulator_title,
      simulator_path = excluded.simulator_path,
      last_opened_at = now(),
      open_count = public.simulator_activity.open_count + 1
  returning * into v_activity;

  return v_activity;
end;
$$;

revoke all on function public.record_simulator_open(text, text, text, text)
  from public, anon;
grant execute on function public.record_simulator_open(text, text, text, text)
  to authenticated;
