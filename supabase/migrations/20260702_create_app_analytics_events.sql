create table if not exists public.app_analytics_events (
  id bigserial primary key,
  created_at timestamptz not null default timezone('utc', now()),
  event_name text not null,
  session_id text,
  user_id uuid references auth.users(id) on delete set null,
  chapter_id text,
  item_id text,
  page_id text,
  simulator_id text,
  path text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  properties jsonb not null default '{}'::jsonb,
  constraint app_analytics_events_event_name_check check (
    event_name ~ '^[a-z0-9_]{2,80}$'
  ),
  constraint app_analytics_events_properties_object_check check (
    jsonb_typeof(properties) = 'object'
  )
);

create index if not exists app_analytics_events_created_at_idx
  on public.app_analytics_events (created_at desc);

create index if not exists app_analytics_events_name_created_at_idx
  on public.app_analytics_events (event_name, created_at desc);

create index if not exists app_analytics_events_user_created_at_idx
  on public.app_analytics_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists app_analytics_events_simulator_created_at_idx
  on public.app_analytics_events (simulator_id, created_at desc)
  where simulator_id is not null;

alter table public.app_analytics_events enable row level security;

revoke all on public.app_analytics_events from anon, authenticated;
grant insert on public.app_analytics_events to anon, authenticated;
grant usage, select on sequence public.app_analytics_events_id_seq to anon, authenticated;

drop policy if exists "Anyone can insert anonymous telemetry" on public.app_analytics_events;
create policy "Anyone can insert anonymous telemetry"
  on public.app_analytics_events
  for insert
  to anon
  with check (user_id is null);

drop policy if exists "Authenticated users can insert their own telemetry" on public.app_analytics_events;
create policy "Authenticated users can insert their own telemetry"
  on public.app_analytics_events
  for insert
  to authenticated
  with check (user_id is null or user_id = (select auth.uid()));
