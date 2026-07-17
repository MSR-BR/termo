create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to service_role;

create or replace function private.ensure_gamification_profile_row(
  p_user_id uuid
)
returns public.gamification_profiles
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_profile public.gamification_profiles%rowtype;
begin
  insert into public.gamification_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_profile
  from public.gamification_profiles
  where user_id = p_user_id
  for update;

  return v_profile;
end;
$function$;

create or replace function public.apply_gamification_event_atomic(
  p_user_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_event_day date,
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
  v_updated_profile public.gamification_profiles%rowtype;
  v_existing_item public.gamification_item_progress%rowtype;
  v_item_key text;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if coalesce(trim(p_event_type), '') = '' then
    raise exception 'p_event_type is required';
  end if;

  if coalesce(trim(p_idempotency_key), '') = '' then
    raise exception 'p_idempotency_key is required';
  end if;

  if p_event_day is null then
    raise exception 'p_event_day is required';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'p_payload must be a json object';
  end if;

  if jsonb_typeof(coalesce(p_profile_patch, '{}'::jsonb)) <> 'object' then
    raise exception 'p_profile_patch must be a json object';
  end if;

  if p_event_type not in (
    'study_item_complete',
    'chapter_quiz_completed',
    'chapter_quiz_review_completed',
    'chapter_quiz_retry_completed',
    'daily_return',
    'chapter_mastery_completed'
  ) then
    raise exception 'Unsupported event type: %', p_event_type;
  end if;

  select *
  into v_existing_event
  from public.gamification_event_log
  where idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select *
    into v_profile
    from public.gamification_profiles
    where user_id = p_user_id;

    return jsonb_build_object(
      'ok', true,
      'persisted', true,
      'deduped', true,
      'awarded', coalesce(v_existing_event.xp_delta, 0) > 0,
      'reason', 'duplicate_idempotency_key',
      'event_id', v_existing_event.id,
      'profile', to_jsonb(v_profile)
    );
  end if;

  v_profile := private.ensure_gamification_profile_row(p_user_id);

  if p_event_type = 'study_item_complete' then
    v_item_key := coalesce(
      nullif(trim(coalesce(p_item_progress_patch ->> 'item_key', '')), ''),
      concat_ws(':', nullif(trim(coalesce(p_chapter_id, '')), ''), nullif(trim(coalesce(p_item_id, '')), ''))
    );

    select *
    into v_existing_item
    from public.gamification_item_progress
    where user_id = p_user_id
      and item_key = v_item_key
    limit 1;

    if found then
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
    user_id,
    event_type,
    idempotency_key,
    event_day,
    chapter_id,
    item_id,
    xp_delta,
    payload
  )
  values (
    p_user_id,
    p_event_type,
    p_idempotency_key,
    p_event_day,
    nullif(trim(coalesce(p_chapter_id, '')), ''),
    nullif(trim(coalesce(p_item_id, '')), ''),
    coalesce(p_xp_delta, 0),
    coalesce(p_payload, '{}'::jsonb)
  )
  returning *
  into v_inserted_event;

  if p_item_progress_patch is not null then
    if jsonb_typeof(p_item_progress_patch) <> 'object' then
      raise exception 'p_item_progress_patch must be a json object when provided';
    end if;

    insert into public.gamification_item_progress (
      user_id,
      chapter_id,
      item_id,
      item_key,
      status,
      completed_at,
      last_reviewed_at,
      source_event_id
    )
    values (
      p_user_id,
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'chapter_id', '')), ''), nullif(trim(coalesce(p_chapter_id, '')), '')),
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'item_id', '')), ''), nullif(trim(coalesce(p_item_id, '')), '')),
      coalesce(
        nullif(trim(coalesce(p_item_progress_patch ->> 'item_key', '')), ''),
        concat_ws(':', nullif(trim(coalesce(p_chapter_id, '')), ''), nullif(trim(coalesce(p_item_id, '')), ''))
      ),
      coalesce(nullif(trim(coalesce(p_item_progress_patch ->> 'status', '')), ''), 'studied'),
      nullif(p_item_progress_patch ->> 'completed_at', '')::timestamptz,
      nullif(p_item_progress_patch ->> 'last_reviewed_at', '')::timestamptz,
      v_inserted_event.id
    )
    on conflict (user_id, item_key) do update
    set chapter_id = excluded.chapter_id,
        item_id = excluded.item_id,
        status = excluded.status,
        completed_at = coalesce(excluded.completed_at, public.gamification_item_progress.completed_at),
        last_reviewed_at = coalesce(excluded.last_reviewed_at, public.gamification_item_progress.last_reviewed_at),
        source_event_id = excluded.source_event_id;
  end if;

  update public.gamification_profiles
  set xp_total = coalesce((p_profile_patch ->> 'xp_total')::integer, xp_total),
      level = coalesce((p_profile_patch ->> 'level')::integer, level),
      current_streak = coalesce((p_profile_patch ->> 'current_streak')::integer, current_streak),
      best_streak = coalesce((p_profile_patch ->> 'best_streak')::integer, best_streak),
      last_active_on = coalesce((p_profile_patch ->> 'last_active_on')::date, last_active_on),
      studied_items_count = coalesce((p_profile_patch ->> 'studied_items_count')::integer, studied_items_count),
      chapters_mastered_count = coalesce((p_profile_patch ->> 'chapters_mastered_count')::integer, chapters_mastered_count),
      last_quiz_summary = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'last_quiz_summary') = 'object'
            then p_profile_patch -> 'last_quiz_summary'
          else null
        end,
        last_quiz_summary
      ),
      recent_badges_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'recent_badges_json') = 'array'
            then p_profile_patch -> 'recent_badges_json'
          else null
        end,
        recent_badges_json
      ),
      active_missions_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'active_missions_json') = 'array'
            then p_profile_patch -> 'active_missions_json'
          else null
        end,
        active_missions_json
      ),
      next_action_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'next_action_json') = 'object'
            then p_profile_patch -> 'next_action_json'
          else null
        end,
        next_action_json
      ),
      preferences_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'preferences_json') = 'object'
            then p_profile_patch -> 'preferences_json'
          else null
        end,
        preferences_json
      )
  where user_id = p_user_id
  returning *
  into v_updated_profile;

  return jsonb_build_object(
    'ok', true,
    'persisted', true,
    'deduped', false,
    'awarded', coalesce(p_xp_delta, 0) > 0,
    'event_id', v_inserted_event.id,
    'profile', to_jsonb(v_updated_profile)
  );
end;
$function$;

create or replace function public.record_chapter_quiz_attempt_atomic(
  p_user_id uuid,
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
  v_profile public.gamification_profiles%rowtype;
  v_existing_attempt public.chapter_quiz_attempts%rowtype;
  v_inserted_attempt public.chapter_quiz_attempts%rowtype;
  v_inserted_event public.gamification_event_log%rowtype;
  v_updated_profile public.gamification_profiles%rowtype;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if coalesce(trim(p_quiz_key), '') = '' then
    raise exception 'p_quiz_key is required';
  end if;

  if coalesce(trim(p_chapter_id), '') = '' then
    raise exception 'p_chapter_id is required';
  end if;

  if p_attempt_type not in ('full_quiz', 'guided_review', 'focused_retry') then
    raise exception 'Unsupported attempt type: %', p_attempt_type;
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'p_answers must be a json array';
  end if;

  if jsonb_typeof(coalesce(p_feedback, '[]'::jsonb)) <> 'array' then
    raise exception 'p_feedback must be a json array';
  end if;

  if jsonb_typeof(coalesce(p_profile_patch, '{}'::jsonb)) <> 'object' then
    raise exception 'p_profile_patch must be a json object';
  end if;

  if p_started_at is null or p_completed_at is null then
    raise exception 'p_started_at and p_completed_at are required';
  end if;

  select *
  into v_existing_attempt
  from public.chapter_quiz_attempts
  where user_id = p_user_id
    and quiz_key = p_quiz_key
    and attempt_type = p_attempt_type
    and completed_at = p_completed_at
  limit 1;

  if found then
    select *
    into v_profile
    from public.gamification_profiles
    where user_id = p_user_id;

    return jsonb_build_object(
      'ok', true,
      'persisted', true,
      'deduped', true,
      'attempt_id', v_existing_attempt.id,
      'profile', to_jsonb(v_profile)
    );
  end if;

  v_profile := private.ensure_gamification_profile_row(p_user_id);

  insert into public.chapter_quiz_attempts (
    user_id,
    quiz_key,
    chapter_id,
    attempt_type,
    score,
    correct_count,
    question_count,
    xp_awarded,
    answers,
    feedback,
    started_at,
    completed_at
  )
  values (
    p_user_id,
    p_quiz_key,
    p_chapter_id,
    p_attempt_type,
    coalesce(p_score, 0),
    coalesce(p_correct_count, 0),
    coalesce(p_question_count, 0),
    coalesce(p_xp_awarded, 0),
    coalesce(p_answers, '[]'::jsonb),
    coalesce(p_feedback, '[]'::jsonb),
    p_started_at,
    p_completed_at
  )
  returning *
  into v_inserted_attempt;

  if coalesce(trim(coalesce(p_event_type, '')), '') <> '' and coalesce(trim(coalesce(p_event_idempotency_key, '')), '') <> '' then
    insert into public.gamification_event_log (
      user_id,
      event_type,
      idempotency_key,
      event_day,
      chapter_id,
      xp_delta,
      payload
    )
    values (
      p_user_id,
      p_event_type,
      p_event_idempotency_key,
      p_completed_at::date,
      p_chapter_id,
      coalesce(p_xp_awarded, 0),
      coalesce(p_event_payload, '{}'::jsonb)
    )
    on conflict (idempotency_key) do nothing
    returning *
    into v_inserted_event;
  end if;

  update public.gamification_profiles
  set xp_total = coalesce((p_profile_patch ->> 'xp_total')::integer, xp_total),
      level = coalesce((p_profile_patch ->> 'level')::integer, level),
      current_streak = coalesce((p_profile_patch ->> 'current_streak')::integer, current_streak),
      best_streak = coalesce((p_profile_patch ->> 'best_streak')::integer, best_streak),
      last_active_on = coalesce((p_profile_patch ->> 'last_active_on')::date, last_active_on),
      studied_items_count = coalesce((p_profile_patch ->> 'studied_items_count')::integer, studied_items_count),
      chapters_mastered_count = coalesce((p_profile_patch ->> 'chapters_mastered_count')::integer, chapters_mastered_count),
      last_quiz_summary = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'last_quiz_summary') = 'object'
            then p_profile_patch -> 'last_quiz_summary'
          else null
        end,
        last_quiz_summary
      ),
      recent_badges_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'recent_badges_json') = 'array'
            then p_profile_patch -> 'recent_badges_json'
          else null
        end,
        recent_badges_json
      ),
      active_missions_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'active_missions_json') = 'array'
            then p_profile_patch -> 'active_missions_json'
          else null
        end,
        active_missions_json
      ),
      next_action_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'next_action_json') = 'object'
            then p_profile_patch -> 'next_action_json'
          else null
        end,
        next_action_json
      ),
      preferences_json = coalesce(
        case
          when jsonb_typeof(p_profile_patch -> 'preferences_json') = 'object'
            then p_profile_patch -> 'preferences_json'
          else null
        end,
        preferences_json
      )
  where user_id = p_user_id
  returning *
  into v_updated_profile;

  return jsonb_build_object(
    'ok', true,
    'persisted', true,
    'deduped', false,
    'attempt_id', v_inserted_attempt.id,
    'event_id', v_inserted_event.id,
    'profile', to_jsonb(v_updated_profile)
  );
end;
$function$;

revoke all on function private.ensure_gamification_profile_row(uuid) from public;
revoke all on function public.apply_gamification_event_atomic(uuid, text, text, date, text, text, integer, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.record_chapter_quiz_attempt_atomic(uuid, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) from public, anon, authenticated;

grant execute on function private.ensure_gamification_profile_row(uuid) to service_role;
grant execute on function public.apply_gamification_event_atomic(uuid, text, text, date, text, text, integer, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.record_chapter_quiz_attempt_atomic(uuid, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) to service_role;
