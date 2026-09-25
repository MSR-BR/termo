-- TERMO T51 — ledger e projeções autoritativas de gamificação v1
--
-- Compatibilidade:
-- - cria o núcleo em instalações novas;
-- - promove, sem apagar dados, as tabelas já aplicadas pelos pacotes 1B/1C;
-- - mantém pontos históricos em baselines explícitos;
-- - não ativa o runtime v1 por si só (rollout depende de variável de ambiente).

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

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
  projection_version text not null default '1.0.0',
  policy_version text not null default 'termo-gamification-policy/1.0.0',
  ledger_cursor bigint not null default 0,
  legacy_xp_baseline integer not null default 0,
  legacy_studied_items_baseline integer not null default 0,
  legacy_mastered_chapters_baseline integer not null default 0,
  reconciled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gamification_profiles_last_quiz_summary_object_check check (jsonb_typeof(last_quiz_summary) = 'object'),
  constraint gamification_profiles_recent_badges_array_check check (jsonb_typeof(recent_badges_json) = 'array'),
  constraint gamification_profiles_active_missions_array_check check (jsonb_typeof(active_missions_json) = 'array'),
  constraint gamification_profiles_next_action_object_check check (jsonb_typeof(next_action_json) = 'object'),
  constraint gamification_profiles_preferences_object_check check (jsonb_typeof(preferences_json) = 'object')
);

alter table public.gamification_profiles
  add column if not exists projection_version text not null default '1.0.0',
  add column if not exists policy_version text not null default 'termo-gamification-policy/1.0.0',
  add column if not exists ledger_cursor bigint not null default 0,
  add column if not exists legacy_xp_baseline integer not null default 0,
  add column if not exists legacy_studied_items_baseline integer not null default 0,
  add column if not exists legacy_mastered_chapters_baseline integer not null default 0,
  add column if not exists reconciled_at timestamptz;

create table if not exists public.gamification_event_log (
  id bigserial primary key,
  event_id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  shared_event_type text,
  idempotency_key text not null,
  event_day date not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  received_at timestamptz not null default timezone('utc', now()),
  policy_version text not null default 'termo-gamification-policy/1.0.0',
  chapter_id text,
  item_id text,
  content_id text,
  section_id text,
  concept_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  attempt_id uuid,
  activity_id text,
  evidence_class text not null default 'activity_only',
  reward_eligible boolean not null default false,
  mastery_eligible boolean not null default false,
  reward_reason text not null default '',
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
  constraint gamification_event_log_payload_object_check check (jsonb_typeof(payload) = 'object')
);

alter table public.gamification_event_log
  add column if not exists event_id uuid default gen_random_uuid(),
  add column if not exists shared_event_type text,
  add column if not exists occurred_at timestamptz,
  add column if not exists received_at timestamptz,
  add column if not exists policy_version text,
  add column if not exists content_id text,
  add column if not exists section_id text,
  add column if not exists concept_ids text[] default '{}',
  add column if not exists source_ids text[] default '{}',
  add column if not exists attempt_id uuid,
  add column if not exists activity_id text,
  add column if not exists evidence_class text,
  add column if not exists reward_eligible boolean,
  add column if not exists mastery_eligible boolean,
  add column if not exists reward_reason text;

update public.gamification_event_log
set event_id = coalesce(event_id, gen_random_uuid()),
    shared_event_type = coalesce(
      shared_event_type,
      case event_type
        when 'study_item_complete' then 'section_completed'
        when 'chapter_quiz_completed' then 'assessment_completed'
        when 'chapter_quiz_review_completed' then 'assessment_reviewed'
        when 'chapter_quiz_retry_completed' then 'assessment_retry_completed'
        when 'daily_return' then 'mechanic_acted'
        when 'chapter_mastery_completed' then 'concept_mastery_reached'
      end
    ),
    occurred_at = coalesce(occurred_at, created_at),
    received_at = coalesce(received_at, created_at),
    policy_version = coalesce(policy_version, 'legacy-phase-1c'),
    concept_ids = coalesce(concept_ids, '{}'),
    source_ids = coalesce(source_ids, '{}'),
    evidence_class = coalesce(
      evidence_class,
      case event_type
        when 'study_item_complete' then 'activity_only'
        when 'chapter_quiz_completed' then 'independent_retrieval'
        when 'chapter_quiz_review_completed' then 'correct_with_help'
        when 'chapter_quiz_retry_completed' then 'independent_retrieval'
        when 'chapter_mastery_completed' then 'mastery_milestone'
        else 'activity_only'
      end
    ),
    reward_eligible = coalesce(reward_eligible, event_type <> 'daily_return' and xp_delta > 0),
    mastery_eligible = coalesce(mastery_eligible, event_type = 'chapter_mastery_completed'),
    reward_reason = coalesce(reward_reason, case when event_type = 'daily_return' then 'legacy_reward_not_repeated' else 'legacy_verified_event' end);

alter table public.gamification_event_log
  alter column event_id set default gen_random_uuid(),
  alter column event_id set not null,
  alter column occurred_at set default timezone('utc', now()),
  alter column occurred_at set not null,
  alter column received_at set default timezone('utc', now()),
  alter column received_at set not null,
  alter column policy_version set default 'termo-gamification-policy/1.0.0',
  alter column policy_version set not null,
  alter column concept_ids set default '{}',
  alter column concept_ids set not null,
  alter column source_ids set default '{}',
  alter column source_ids set not null,
  alter column evidence_class set default 'activity_only',
  alter column evidence_class set not null,
  alter column reward_eligible set default false,
  alter column reward_eligible set not null,
  alter column mastery_eligible set default false,
  alter column mastery_eligible set not null,
  alter column reward_reason set default '',
  alter column reward_reason set not null;

alter table public.gamification_event_log
  drop constraint if exists gamification_event_log_idempotency_key_key;

create unique index if not exists gamification_event_log_event_id_uidx
  on public.gamification_event_log (event_id);
create unique index if not exists gamification_event_log_user_idempotency_uidx
  on public.gamification_event_log (user_id, idempotency_key);
create index if not exists gamification_event_log_user_received_at_idx
  on public.gamification_event_log (user_id, received_at desc);
create index if not exists gamification_event_log_user_shared_type_idx
  on public.gamification_event_log (user_id, shared_event_type, occurred_at desc);

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

alter table public.gamification_item_progress
  add column if not exists source_event_id bigint references public.gamification_event_log(id) on delete set null;

create table if not exists public.chapter_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text,
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

alter table public.chapter_quiz_attempts
  add column if not exists idempotency_key text;

update public.chapter_quiz_attempts
set idempotency_key = coalesce(idempotency_key, 'legacy:' || id::text);

create unique index if not exists chapter_quiz_attempts_user_idempotency_uidx
  on public.chapter_quiz_attempts (user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists chapter_quiz_attempts_user_chapter_completed_at_idx
  on public.chapter_quiz_attempts (user_id, chapter_id, completed_at desc);
create index if not exists gamification_item_progress_user_chapter_idx
  on public.gamification_item_progress (user_id, chapter_id, item_id);

insert into public.gamification_profiles (user_id)
select distinct event_rows.user_id
from public.gamification_event_log as event_rows
on conflict (user_id) do nothing;

update public.gamification_profiles as profiles
set legacy_xp_baseline = greatest(
      0,
      profiles.xp_total - coalesce((
        select sum(events.xp_delta) filter (where events.reward_eligible)
        from public.gamification_event_log as events
        where events.user_id = profiles.user_id
      ), 0)
    ),
    legacy_studied_items_baseline = greatest(
      0,
      profiles.studied_items_count - coalesce((
        select count(*)
        from public.gamification_item_progress as progress
        where progress.user_id = profiles.user_id
      ), 0)
    ),
    legacy_mastered_chapters_baseline = greatest(
      0,
      profiles.chapters_mastered_count - coalesce((
        select count(distinct events.chapter_id)
        from public.gamification_event_log as events
        where events.user_id = profiles.user_id
          and events.chapter_id is not null
          and (
            events.event_type = 'chapter_mastery_completed'
            or (
              events.event_type = 'chapter_quiz_completed'
              and coalesce(events.payload #>> '{quizSummary,isMastered}', 'false') = 'true'
            )
          )
      ), 0)
    ),
    projection_version = '1.0.0',
    policy_version = 'termo-gamification-policy/1.0.0';

create or replace function public.set_gamification_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

create or replace function public.set_gamification_item_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

drop trigger if exists gamification_profiles_set_updated_at on public.gamification_profiles;
create trigger gamification_profiles_set_updated_at
before update on public.gamification_profiles
for each row execute function public.set_gamification_profiles_updated_at();

drop trigger if exists gamification_item_progress_set_updated_at on public.gamification_item_progress;
create trigger gamification_item_progress_set_updated_at
before update on public.gamification_item_progress
for each row execute function public.set_gamification_item_progress_updated_at();

create or replace function private.ensure_gamification_profile_row_v1(p_user_id uuid)
returns public.gamification_profiles
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_profile public.gamification_profiles%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  insert into public.gamification_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_profile
  from public.gamification_profiles
  where user_id = p_user_id
  for update;

  return v_profile;
end;
$function$;

create or replace function private.gamification_projection_v1(p_user_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  with profile as (
    select * from public.gamification_profiles where user_id = p_user_id
  ),
  ledger as (
    select
      coalesce(sum(xp_delta) filter (where reward_eligible), 0)::integer as ledger_xp,
      coalesce(max(id), 0)::bigint as ledger_cursor
    from public.gamification_event_log
    where user_id = p_user_id
  ),
  studied as (
    select count(*)::integer as ledger_studied
    from public.gamification_item_progress
    where user_id = p_user_id
  ),
  mastered as (
    select count(distinct chapter_id)::integer as ledger_mastered
    from public.gamification_event_log
    where user_id = p_user_id
      and chapter_id is not null
      and (
        event_type = 'chapter_mastery_completed'
        or (
          event_type = 'chapter_quiz_completed'
          and coalesce(payload #>> '{quizSummary,isMastered}', 'false') = 'true'
        )
      )
  ),
  days as (
    select distinct event_day
    from public.gamification_event_log
    where user_id = p_user_id
      and event_type <> 'daily_return'
  ),
  numbered_days as (
    select event_day, event_day - (row_number() over (order by event_day))::integer as streak_group
    from days
  ),
  streaks as (
    select min(event_day) as started_on, max(event_day) as ended_on, count(*)::integer as streak_length
    from numbered_days
    group by streak_group
  ),
  streak_summary as (
    select
      coalesce((select streak_length from streaks order by ended_on desc limit 1), 0)::integer as current_streak,
      coalesce(max(streak_length), 0)::integer as best_streak,
      max(ended_on) as last_active_on
    from streaks
  )
  select jsonb_build_object(
    'xp_total', profile.legacy_xp_baseline + ledger.ledger_xp,
    'level', greatest(1, floor((profile.legacy_xp_baseline + ledger.ledger_xp) / 100.0)::integer + 1),
    'studied_items_count', profile.legacy_studied_items_baseline + studied.ledger_studied,
    'chapters_mastered_count', profile.legacy_mastered_chapters_baseline + mastered.ledger_mastered,
    'current_streak', streak_summary.current_streak,
    'best_streak', streak_summary.best_streak,
    'last_active_on', streak_summary.last_active_on,
    'ledger_cursor', ledger.ledger_cursor,
    'projection_version', '1.0.0',
    'policy_version', 'termo-gamification-policy/1.0.0'
  )
  from profile, ledger, studied, mastered, streak_summary;
$function$;

create or replace function private.apply_gamification_projection_v1(
  p_user_id uuid,
  p_profile_patch jsonb default '{}'::jsonb,
  p_mark_reconciled boolean default false
)
returns public.gamification_profiles
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_projection jsonb;
  v_profile public.gamification_profiles%rowtype;
begin
  perform private.ensure_gamification_profile_row_v1(p_user_id);
  v_projection := private.gamification_projection_v1(p_user_id);

  if jsonb_typeof(coalesce(p_profile_patch, '{}'::jsonb)) <> 'object' then
    raise exception 'p_profile_patch must be a json object';
  end if;

  update public.gamification_profiles
  set xp_total = (v_projection ->> 'xp_total')::integer,
      level = (v_projection ->> 'level')::integer,
      current_streak = (v_projection ->> 'current_streak')::integer,
      best_streak = (v_projection ->> 'best_streak')::integer,
      last_active_on = nullif(v_projection ->> 'last_active_on', '')::date,
      studied_items_count = (v_projection ->> 'studied_items_count')::integer,
      chapters_mastered_count = (v_projection ->> 'chapters_mastered_count')::integer,
      ledger_cursor = (v_projection ->> 'ledger_cursor')::bigint,
      projection_version = v_projection ->> 'projection_version',
      policy_version = v_projection ->> 'policy_version',
      last_quiz_summary = case
        when jsonb_typeof(p_profile_patch -> 'last_quiz_summary') = 'object'
          then p_profile_patch -> 'last_quiz_summary'
        else last_quiz_summary
      end,
      recent_badges_json = case
        when jsonb_typeof(p_profile_patch -> 'recent_badges_json') = 'array'
          then p_profile_patch -> 'recent_badges_json'
        else recent_badges_json
      end,
      active_missions_json = case
        when jsonb_typeof(p_profile_patch -> 'active_missions_json') = 'array'
          then p_profile_patch -> 'active_missions_json'
        else active_missions_json
      end,
      next_action_json = case
        when jsonb_typeof(p_profile_patch -> 'next_action_json') = 'object'
          then p_profile_patch -> 'next_action_json'
        else next_action_json
      end,
      preferences_json = case
        when jsonb_typeof(p_profile_patch -> 'preferences_json') = 'object'
          then p_profile_patch -> 'preferences_json'
        else preferences_json
      end,
      reconciled_at = case when p_mark_reconciled then timezone('utc', now()) else reconciled_at end
  where user_id = p_user_id
  returning * into v_profile;

  return v_profile;
end;
$function$;

create or replace function public.apply_gamification_event_atomic_v1(
  p_user_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_event_day date,
  p_occurred_at timestamptz default null,
  p_chapter_id text default null,
  p_item_id text default null,
  p_xp_delta integer default 0,
  p_payload jsonb default '{}'::jsonb,
  p_profile_patch jsonb default '{}'::jsonb,
  p_item_progress_patch jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_existing_event public.gamification_event_log%rowtype;
  v_inserted_event public.gamification_event_log%rowtype;
  v_profile public.gamification_profiles%rowtype;
  v_item_key text;
  v_shared_event_type text;
  v_evidence_class text;
  v_xp_delta integer;
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;
  if coalesce(trim(p_idempotency_key), '') = '' then raise exception 'p_idempotency_key is required'; end if;
  if p_event_day is null then raise exception 'p_event_day is required'; end if;
  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then raise exception 'p_payload must be a json object'; end if;

  v_shared_event_type := case p_event_type
    when 'study_item_complete' then 'section_completed'
    when 'chapter_quiz_completed' then 'assessment_completed'
    when 'chapter_quiz_review_completed' then 'assessment_reviewed'
    when 'chapter_quiz_retry_completed' then 'assessment_retry_completed'
    when 'daily_return' then 'mechanic_acted'
    when 'chapter_mastery_completed' then 'concept_mastery_reached'
    else null
  end;
  if v_shared_event_type is null then raise exception 'Unsupported event type: %', p_event_type; end if;

  v_evidence_class := case p_event_type
    when 'study_item_complete' then 'activity_only'
    when 'chapter_quiz_completed' then 'independent_retrieval'
    when 'chapter_quiz_review_completed' then 'correct_with_help'
    when 'chapter_quiz_retry_completed' then 'independent_retrieval'
    when 'chapter_mastery_completed' then 'mastery_milestone'
    else 'activity_only'
  end;
  v_xp_delta := case when p_event_type = 'daily_return' then 0 else greatest(0, least(coalesce(p_xp_delta, 0), 200)) end;

  select * into v_existing_event
  from public.gamification_event_log
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select * into v_profile from public.gamification_profiles where user_id = p_user_id;
    return jsonb_build_object(
      'ok', true,
      'persisted', true,
      'deduped', true,
      'awarded', coalesce(v_existing_event.xp_delta, 0) > 0,
      'reason', 'duplicate_idempotency_key',
      'event_id', v_existing_event.event_id,
      'profile', to_jsonb(v_profile)
    );
  end if;

  perform private.ensure_gamification_profile_row_v1(p_user_id);

  if p_event_type = 'study_item_complete' then
    v_item_key := coalesce(
      nullif(trim(coalesce(p_item_progress_patch ->> 'item_key', '')), ''),
      concat_ws(':', nullif(trim(coalesce(p_chapter_id, '')), ''), nullif(trim(coalesce(p_item_id, '')), ''))
    );
    perform 1
    from public.gamification_item_progress
    where user_id = p_user_id and item_key = v_item_key
    limit 1;

    if found then
      select * into v_profile from public.gamification_profiles where user_id = p_user_id;
      return jsonb_build_object(
        'ok', true,
        'persisted', false,
        'deduped', false,
        'awarded', false,
        'reason', 'item_already_studied',
        'profile', to_jsonb(v_profile)
      );
    end if;
  end if;

  insert into public.gamification_event_log (
    user_id, event_type, shared_event_type, idempotency_key, event_day,
    occurred_at, received_at, policy_version, chapter_id, item_id,
    content_id, section_id, evidence_class, reward_eligible,
    mastery_eligible, reward_reason, xp_delta, payload
  ) values (
    p_user_id, p_event_type, v_shared_event_type, p_idempotency_key, p_event_day,
    coalesce(p_occurred_at, timezone('utc', now())), timezone('utc', now()),
    'termo-gamification-policy/1.0.0', nullif(trim(coalesce(p_chapter_id, '')), ''),
    nullif(trim(coalesce(p_item_id, '')), ''), nullif(trim(coalesce(p_chapter_id, '')), ''),
    nullif(trim(coalesce(p_item_id, '')), ''), v_evidence_class,
    v_xp_delta > 0, p_event_type = 'chapter_mastery_completed',
    case when v_xp_delta > 0 then 'verified_learning_event' else 'non_rewarded_event' end,
    v_xp_delta, coalesce(p_payload, '{}'::jsonb)
  ) returning * into v_inserted_event;

  if p_item_progress_patch is not null then
    if jsonb_typeof(p_item_progress_patch) <> 'object' then raise exception 'p_item_progress_patch must be a json object'; end if;
    insert into public.gamification_item_progress (
      user_id, chapter_id, item_id, item_key, status, completed_at, last_reviewed_at, source_event_id
    ) values (
      p_user_id,
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'chapter_id', '')), ''), p_chapter_id),
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'item_id', '')), ''), p_item_id),
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'item_key', '')), ''), v_item_key),
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'status', '')), ''), 'studied'),
      coalesce(nullif(p_item_progress_patch ->> 'completed_at', '')::timestamptz, v_inserted_event.occurred_at),
      nullif(p_item_progress_patch ->> 'last_reviewed_at', '')::timestamptz,
      v_inserted_event.id
    )
    on conflict (user_id, item_key) do update
    set status = excluded.status,
        last_reviewed_at = coalesce(excluded.last_reviewed_at, public.gamification_item_progress.last_reviewed_at),
        source_event_id = excluded.source_event_id;
  end if;

  v_profile := private.apply_gamification_projection_v1(p_user_id, p_profile_patch, false);

  return jsonb_build_object(
    'ok', true,
    'persisted', true,
    'deduped', false,
    'awarded', v_xp_delta > 0,
    'reason', case when v_xp_delta > 0 then 'verified_learning_event' else 'non_rewarded_event' end,
    'event_id', v_inserted_event.event_id,
    'profile', to_jsonb(v_profile)
  );
end;
$function$;

create or replace function public.record_chapter_quiz_attempt_atomic_v1(
  p_user_id uuid,
  p_attempt_idempotency_key text,
  p_quiz_key text,
  p_chapter_id text,
  p_attempt_type text,
  p_score integer,
  p_correct_count integer,
  p_question_count integer,
  p_xp_awarded integer,
  p_answers jsonb,
  p_feedback jsonb,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_profile_patch jsonb default '{}'::jsonb,
  p_event_type text default null,
  p_event_idempotency_key text default null,
  p_event_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_existing_attempt public.chapter_quiz_attempts%rowtype;
  v_inserted_attempt public.chapter_quiz_attempts%rowtype;
  v_inserted_event public.gamification_event_log%rowtype;
  v_profile public.gamification_profiles%rowtype;
  v_shared_event_type text;
  v_evidence_class text;
  v_xp_awarded integer;
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;
  if coalesce(trim(p_attempt_idempotency_key), '') = '' then raise exception 'p_attempt_idempotency_key is required'; end if;
  if coalesce(trim(p_quiz_key), '') = '' then raise exception 'p_quiz_key is required'; end if;
  if coalesce(trim(p_chapter_id), '') = '' then raise exception 'p_chapter_id is required'; end if;
  if p_attempt_type not in ('full_quiz', 'guided_review', 'focused_retry') then raise exception 'Unsupported attempt type: %', p_attempt_type; end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then raise exception 'p_answers must be a json array'; end if;
  if jsonb_typeof(coalesce(p_feedback, '[]'::jsonb)) <> 'array' then raise exception 'p_feedback must be a json array'; end if;
  if p_started_at is null or p_completed_at is null then raise exception 'p_started_at and p_completed_at are required'; end if;
  if p_event_type not in ('chapter_quiz_completed', 'chapter_quiz_review_completed', 'chapter_quiz_retry_completed') then
    raise exception 'Unsupported quiz event type: %', p_event_type;
  end if;
  if coalesce(trim(coalesce(p_event_idempotency_key, '')), '') <> p_attempt_idempotency_key then
    raise exception 'event idempotency key must match attempt idempotency key';
  end if;

  select * into v_existing_attempt
  from public.chapter_quiz_attempts
  where user_id = p_user_id and idempotency_key = p_attempt_idempotency_key
  limit 1;

  if found then
    select * into v_profile from public.gamification_profiles where user_id = p_user_id;
    return jsonb_build_object(
      'ok', true,
      'persisted', true,
      'deduped', true,
      'attempt_id', v_existing_attempt.id,
      'profile', to_jsonb(v_profile)
    );
  end if;

  perform private.ensure_gamification_profile_row_v1(p_user_id);

  insert into public.chapter_quiz_attempts (
    user_id, idempotency_key, quiz_key, chapter_id, attempt_type,
    score, correct_count, question_count, xp_awarded,
    answers, feedback, started_at, completed_at
  ) values (
    p_user_id, p_attempt_idempotency_key, p_quiz_key, p_chapter_id, p_attempt_type,
    greatest(0, least(coalesce(p_score, 0), 100)), greatest(0, coalesce(p_correct_count, 0)),
    greatest(0, coalesce(p_question_count, 0)), greatest(0, least(coalesce(p_xp_awarded, 0), 200)),
    coalesce(p_answers, '[]'::jsonb), coalesce(p_feedback, '[]'::jsonb), p_started_at, p_completed_at
  ) returning * into v_inserted_attempt;

  v_shared_event_type := case p_event_type
    when 'chapter_quiz_completed' then 'assessment_completed'
    when 'chapter_quiz_review_completed' then 'assessment_reviewed'
    when 'chapter_quiz_retry_completed' then 'assessment_retry_completed'
    else null
  end;
  v_evidence_class := case p_event_type
    when 'chapter_quiz_review_completed' then 'correct_with_help'
    else 'independent_retrieval'
  end;
  v_xp_awarded := greatest(0, least(coalesce(p_xp_awarded, 0), 200));

  insert into public.gamification_event_log (
    user_id, event_type, shared_event_type, idempotency_key, event_day,
    occurred_at, received_at, policy_version, chapter_id, content_id,
    attempt_id, evidence_class, reward_eligible, mastery_eligible,
    reward_reason, xp_delta, payload
  ) values (
    p_user_id, p_event_type, v_shared_event_type, p_event_idempotency_key, p_completed_at::date,
    p_completed_at, timezone('utc', now()), 'termo-gamification-policy/1.0.0',
    p_chapter_id, p_chapter_id, v_inserted_attempt.id, v_evidence_class,
    v_xp_awarded > 0, false, case when v_xp_awarded > 0 then 'verified_assessment' else 'assessment_without_reward' end,
    v_xp_awarded, coalesce(p_event_payload, '{}'::jsonb)
  )
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_inserted_event;

  if v_inserted_event.id is null then
    raise exception 'quiz event idempotency conflict without matching attempt';
  end if;

  v_profile := private.apply_gamification_projection_v1(p_user_id, p_profile_patch, false);

  return jsonb_build_object(
    'ok', true,
    'persisted', true,
    'deduped', false,
    'attempt_id', v_inserted_attempt.id,
    'event_id', v_inserted_event.event_id,
    'profile', to_jsonb(v_profile)
  );
end;
$function$;

create or replace function public.reconcile_gamification_profile_v1(
  p_user_id uuid,
  p_apply boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_before public.gamification_profiles%rowtype;
  v_after public.gamification_profiles%rowtype;
  v_projection jsonb;
begin
  select * into v_before from public.gamification_profiles where user_id = p_user_id;
  if not found then raise exception 'profile not found'; end if;

  v_projection := private.gamification_projection_v1(p_user_id);
  if p_apply then
    v_after := private.apply_gamification_projection_v1(p_user_id, '{}'::jsonb, true);
  else
    v_after := v_before;
  end if;

  return jsonb_build_object(
    'ok', true,
    'mode', case when p_apply then 'apply' else 'dry_run' end,
    'user_id', p_user_id,
    'projection', v_projection,
    'before', jsonb_build_object(
      'xp_total', v_before.xp_total,
      'studied_items_count', v_before.studied_items_count,
      'chapters_mastered_count', v_before.chapters_mastered_count,
      'ledger_cursor', v_before.ledger_cursor
    ),
    'after', jsonb_build_object(
      'xp_total', v_after.xp_total,
      'studied_items_count', v_after.studied_items_count,
      'chapters_mastered_count', v_after.chapters_mastered_count,
      'ledger_cursor', v_after.ledger_cursor
    )
  );
end;
$function$;

alter table public.gamification_profiles enable row level security;
alter table public.gamification_event_log enable row level security;
alter table public.gamification_item_progress enable row level security;
alter table public.chapter_quiz_attempts enable row level security;

revoke all on table public.gamification_profiles from public, anon, authenticated, service_role;
revoke all on table public.gamification_event_log from public, anon, authenticated, service_role;
revoke all on table public.gamification_item_progress from public, anon, authenticated, service_role;
revoke all on table public.chapter_quiz_attempts from public, anon, authenticated, service_role;
revoke all on sequence public.gamification_event_log_id_seq from public, anon, authenticated, service_role;

grant select on table public.gamification_profiles to authenticated;
grant select on table public.gamification_event_log to authenticated;
grant select on table public.gamification_item_progress to authenticated;
grant select on table public.chapter_quiz_attempts to authenticated;

grant select, insert, update on table public.gamification_profiles to service_role;
grant select, insert on table public.gamification_event_log to service_role;
grant select, insert, update on table public.gamification_item_progress to service_role;
grant select, insert on table public.chapter_quiz_attempts to service_role;
grant usage, select on sequence public.gamification_event_log_id_seq to service_role;

drop policy if exists "Users can view their own gamification profile" on public.gamification_profiles;
create policy "Users can view their own gamification profile"
on public.gamification_profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own gamification event log" on public.gamification_event_log;
create policy "Users can view their own gamification event log"
on public.gamification_event_log for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own item progress" on public.gamification_item_progress;
create policy "Users can view their own item progress"
on public.gamification_item_progress for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can view their own quiz attempts" on public.chapter_quiz_attempts;
create policy "Users can view their own quiz attempts"
on public.chapter_quiz_attempts for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert their own gamification event log" on public.gamification_event_log;
drop policy if exists "Users can insert their own item progress" on public.gamification_item_progress;
drop policy if exists "Users can update their own item progress" on public.gamification_item_progress;
drop policy if exists "Users can insert their own quiz attempts" on public.chapter_quiz_attempts;

revoke all on function public.set_gamification_profiles_updated_at() from public, anon, authenticated;
revoke all on function public.set_gamification_item_progress_updated_at() from public, anon, authenticated;
revoke all on function private.ensure_gamification_profile_row_v1(uuid) from public;
revoke all on function private.gamification_projection_v1(uuid) from public;
revoke all on function private.apply_gamification_projection_v1(uuid, jsonb, boolean) from public;
revoke all on function public.apply_gamification_event_atomic_v1(uuid, text, text, date, timestamptz, text, text, integer, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.record_chapter_quiz_attempt_atomic_v1(uuid, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.reconcile_gamification_profile_v1(uuid, boolean) from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.ensure_gamification_profile_row_v1(uuid) to service_role;
grant execute on function private.gamification_projection_v1(uuid) to service_role;
grant execute on function private.apply_gamification_projection_v1(uuid, jsonb, boolean) to service_role;
grant execute on function public.apply_gamification_event_atomic_v1(uuid, text, text, date, timestamptz, text, text, integer, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.record_chapter_quiz_attempt_atomic_v1(uuid, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) to service_role;
grant execute on function public.reconcile_gamification_profile_v1(uuid, boolean) to service_role;

comment on table public.gamification_event_log is
  'Ledger append-only da gamificação TERMO. Escrita apenas por RPCs server-side; leitura do próprio usuário via RLS.';
comment on function public.reconcile_gamification_profile_v1(uuid, boolean) is
  'Reconcilia a projeção v1. O padrão é dry-run; apply=true exige chamada server-side explicitamente autorizada.';
