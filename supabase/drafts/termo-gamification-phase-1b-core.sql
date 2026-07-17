create extension if not exists pgcrypto;

create table if not exists public.gamification_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp_total integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_active_on date,
  studied_items_count integer not null default 0,
  chapters_mastered_count integer not null default 0,
  last_quiz_summary jsonb not null default '{}'::jsonb,
  recent_badges_json jsonb not null default '[]'::jsonb,
  active_missions_json jsonb not null default '[]'::jsonb,
  next_action_json jsonb not null default '{}'::jsonb,
  preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gamification_profiles_last_quiz_summary_object_check check (jsonb_typeof(last_quiz_summary) = 'object'),
  constraint gamification_profiles_recent_badges_array_check check (jsonb_typeof(recent_badges_json) = 'array'),
  constraint gamification_profiles_active_missions_array_check check (jsonb_typeof(active_missions_json) = 'array'),
  constraint gamification_profiles_next_action_object_check check (jsonb_typeof(next_action_json) = 'object'),
  constraint gamification_profiles_preferences_object_check check (jsonb_typeof(preferences_json) = 'object')
);

create table if not exists public.gamification_event_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  idempotency_key text not null unique,
  event_day date not null,
  chapter_id text,
  item_id text,
  xp_delta integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint gamification_event_log_event_type_check check (
    event_type in (
      'study_item_complete',
      'chapter_quiz_completed',
      'chapter_quiz_review_completed',
      'chapter_quiz_retry_completed',
      'daily_return',
      'chapter_mastery_completed'
    )
  ),
  constraint gamification_event_log_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  )
);

create table if not exists public.gamification_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  item_id text not null,
  item_key text not null,
  status text not null check (status in ('studied', 'reviewed')),
  completed_at timestamptz,
  last_reviewed_at timestamptz,
  source_event_id bigint references public.gamification_event_log(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, item_key)
);

create table if not exists public.chapter_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_key text not null,
  chapter_id text not null,
  attempt_type text not null check (attempt_type in ('full_quiz', 'guided_review', 'focused_retry')),
  score integer not null default 0,
  correct_count integer not null default 0,
  question_count integer not null default 0,
  xp_awarded integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '[]'::jsonb,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chapter_quiz_attempts_answers_array_check check (jsonb_typeof(answers) = 'array'),
  constraint chapter_quiz_attempts_feedback_array_check check (jsonb_typeof(feedback) = 'array')
);

create index if not exists gamification_profiles_last_active_on_idx
  on public.gamification_profiles (last_active_on desc nulls last);

create index if not exists gamification_event_log_user_created_at_idx
  on public.gamification_event_log (user_id, created_at desc);

create index if not exists gamification_event_log_user_event_day_idx
  on public.gamification_event_log (user_id, event_day desc);

create index if not exists gamification_item_progress_user_chapter_idx
  on public.gamification_item_progress (user_id, chapter_id, item_id);

create index if not exists chapter_quiz_attempts_user_chapter_completed_at_idx
  on public.chapter_quiz_attempts (user_id, chapter_id, completed_at desc);

alter table public.gamification_profiles enable row level security;
alter table public.gamification_event_log enable row level security;
alter table public.gamification_item_progress enable row level security;
alter table public.chapter_quiz_attempts enable row level security;

revoke all on public.gamification_profiles from anon, authenticated;
revoke all on public.gamification_event_log from anon, authenticated;
revoke all on public.gamification_item_progress from anon, authenticated;
revoke all on public.chapter_quiz_attempts from anon, authenticated;

grant select on public.gamification_profiles to authenticated;
grant select, insert on public.gamification_event_log to authenticated;
grant select, insert, update on public.gamification_item_progress to authenticated;
grant select, insert on public.chapter_quiz_attempts to authenticated;
grant usage, select on sequence public.gamification_event_log_id_seq to authenticated;

create or replace function public.set_gamification_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_gamification_item_progress_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists gamification_profiles_set_updated_at on public.gamification_profiles;
create trigger gamification_profiles_set_updated_at
before update on public.gamification_profiles
for each row
execute function public.set_gamification_profiles_updated_at();

drop trigger if exists gamification_item_progress_set_updated_at on public.gamification_item_progress;
create trigger gamification_item_progress_set_updated_at
before update on public.gamification_item_progress
for each row
execute function public.set_gamification_item_progress_updated_at();

drop policy if exists "Users can view their own gamification profile" on public.gamification_profiles;
create policy "Users can view their own gamification profile"
on public.gamification_profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own gamification event log" on public.gamification_event_log;
create policy "Users can view their own gamification event log"
on public.gamification_event_log
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert their own gamification event log" on public.gamification_event_log;
create policy "Users can insert their own gamification event log"
on public.gamification_event_log
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own item progress" on public.gamification_item_progress;
create policy "Users can view their own item progress"
on public.gamification_item_progress
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert their own item progress" on public.gamification_item_progress;
create policy "Users can insert their own item progress"
on public.gamification_item_progress
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update their own item progress" on public.gamification_item_progress;
create policy "Users can update their own item progress"
on public.gamification_item_progress
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own quiz attempts" on public.chapter_quiz_attempts;
create policy "Users can view their own quiz attempts"
on public.chapter_quiz_attempts
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert their own quiz attempts" on public.chapter_quiz_attempts;
create policy "Users can insert their own quiz attempts"
on public.chapter_quiz_attempts
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
