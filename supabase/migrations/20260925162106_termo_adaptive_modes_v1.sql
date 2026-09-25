-- TERMO T52 — modos adaptativos e recompensas pedagogicas v1.1
--
-- Esta migracao permanece local ate autorizacao explicita de rollout.
-- Ela nao cria escrita pelo navegador: somente service_role executa o RPC.

alter table public.gamification_profiles
  alter column policy_version set default 'termo-gamification-policy/1.1.0';

alter table public.gamification_event_log
  alter column policy_version set default 'termo-gamification-policy/1.1.0';

alter table public.gamification_event_log
  drop constraint if exists gamification_event_log_event_type_check;
alter table public.gamification_event_log
  add constraint gamification_event_log_event_type_check check (
    event_type in (
      'study_item_complete',
      'chapter_quiz_completed',
      'chapter_quiz_review_completed',
      'chapter_quiz_retry_completed',
      'daily_challenge_completed',
      'daily_return',
      'chapter_mastery_completed'
    )
  );

alter table public.chapter_quiz_attempts
  drop constraint if exists chapter_quiz_attempts_attempt_type_check;
alter table public.chapter_quiz_attempts
  add constraint chapter_quiz_attempts_attempt_type_check check (
    attempt_type in ('full_quiz', 'guided_review', 'focused_retry', 'daily_challenge')
  );

create unique index if not exists gamification_event_log_one_daily_challenge_uidx
  on public.gamification_event_log (user_id, event_day)
  where event_type = 'daily_challenge_completed';

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
  v_existing_daily public.gamification_event_log%rowtype;
  v_inserted_attempt public.chapter_quiz_attempts%rowtype;
  v_inserted_event public.gamification_event_log%rowtype;
  v_profile public.gamification_profiles%rowtype;
  v_shared_event_type text;
  v_evidence_class text;
  v_xp_awarded integer;
  v_all_independent boolean;
  v_concept_ids text[];
  v_source_ids text[];
begin
  if p_user_id is null then raise exception 'p_user_id is required'; end if;
  if coalesce(trim(p_attempt_idempotency_key), '') = '' then raise exception 'p_attempt_idempotency_key is required'; end if;
  if coalesce(trim(p_quiz_key), '') = '' then raise exception 'p_quiz_key is required'; end if;
  if coalesce(trim(p_chapter_id), '') = '' then raise exception 'p_chapter_id is required'; end if;
  if p_attempt_type not in ('full_quiz', 'guided_review', 'focused_retry', 'daily_challenge') then
    raise exception 'Unsupported attempt type: %', p_attempt_type;
  end if;
  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then raise exception 'p_answers must be a json array'; end if;
  if jsonb_typeof(coalesce(p_feedback, '[]'::jsonb)) <> 'array' then raise exception 'p_feedback must be a json array'; end if;
  if p_started_at is null or p_completed_at is null then raise exception 'p_started_at and p_completed_at are required'; end if;
  if p_event_type not in (
    'chapter_quiz_completed',
    'chapter_quiz_review_completed',
    'chapter_quiz_retry_completed',
    'daily_challenge_completed'
  ) then
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
      'ok', true, 'persisted', true, 'deduped', true,
      'attempt_id', v_existing_attempt.id, 'profile', to_jsonb(v_profile)
    );
  end if;

  if p_event_type = 'daily_challenge_completed' then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        p_user_id::text || ':' || (p_completed_at at time zone 'UTC')::date::text,
        0
      )
    );
    select * into v_existing_daily
    from public.gamification_event_log
    where user_id = p_user_id
      and event_type = 'daily_challenge_completed'
      and event_day = (p_completed_at at time zone 'UTC')::date
    limit 1;
    if found then
      select * into v_profile from public.gamification_profiles where user_id = p_user_id;
      return jsonb_build_object(
        'ok', true, 'persisted', true, 'deduped', true,
        'attempt_id', v_existing_daily.attempt_id, 'profile', to_jsonb(v_profile)
      );
    end if;
  end if;

  perform private.ensure_gamification_profile_row_v1(p_user_id);

  v_all_independent := jsonb_array_length(coalesce(p_feedback, '[]'::jsonb)) > 0
    and exists (
      select 1
      from jsonb_array_elements(coalesce(p_feedback, '[]'::jsonb)) as feedback_item
      where coalesce((feedback_item ->> 'isCorrect')::boolean, false) is true
    )
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_feedback, '[]'::jsonb)) as feedback_item
      where coalesce((feedback_item ->> 'isCorrect')::boolean, false) is true
        and coalesce((feedback_item ->> 'masteryEligible')::boolean, false) is not true
    );

  select coalesce(array_agg(distinct concept_id), '{}') into v_concept_ids
  from jsonb_array_elements(coalesce(p_feedback, '[]'::jsonb)) as feedback_item,
       jsonb_array_elements_text(coalesce(feedback_item -> 'conceptIds', '[]'::jsonb)) as concept_id;

  select coalesce(array_agg(distinct source_id), '{}') into v_source_ids
  from jsonb_array_elements(coalesce(p_feedback, '[]'::jsonb)) as feedback_item,
       jsonb_array_elements_text(coalesce(feedback_item -> 'sourceIds', '[]'::jsonb)) as source_id;

  v_xp_awarded := case
    when p_event_type = 'daily_challenge_completed' then greatest(0, least(coalesce(p_xp_awarded, 0), 10))
    else greatest(0, least(coalesce(p_xp_awarded, 0), 200))
  end;

  insert into public.chapter_quiz_attempts (
    user_id, idempotency_key, quiz_key, chapter_id, attempt_type,
    score, correct_count, question_count, xp_awarded,
    answers, feedback, started_at, completed_at
  ) values (
    p_user_id, p_attempt_idempotency_key, p_quiz_key, p_chapter_id, p_attempt_type,
    greatest(0, least(coalesce(p_score, 0), 100)), greatest(0, coalesce(p_correct_count, 0)),
    greatest(0, coalesce(p_question_count, 0)), v_xp_awarded,
    coalesce(p_answers, '[]'::jsonb), coalesce(p_feedback, '[]'::jsonb), p_started_at, p_completed_at
  ) returning * into v_inserted_attempt;

  v_shared_event_type := case p_event_type
    when 'chapter_quiz_completed' then 'assessment_completed'
    when 'chapter_quiz_review_completed' then 'assessment_reviewed'
    when 'chapter_quiz_retry_completed' then 'assessment_retry_completed'
    when 'daily_challenge_completed' then 'daily_challenge_completed'
  end;
  v_evidence_class := case
    when p_event_type = 'chapter_quiz_review_completed' then 'correct_with_help'
    when v_all_independent then 'independent_retrieval'
    else 'attempt_without_outcome'
  end;

  insert into public.gamification_event_log (
    user_id, event_type, shared_event_type, idempotency_key, event_day,
    occurred_at, received_at, policy_version, chapter_id, content_id,
    concept_ids, source_ids, attempt_id, activity_id, evidence_class,
    reward_eligible, mastery_eligible, reward_reason, xp_delta, payload
  ) values (
    p_user_id, p_event_type, v_shared_event_type, p_event_idempotency_key,
    (p_completed_at at time zone 'UTC')::date,
    p_completed_at, timezone('utc', now()), 'termo-gamification-policy/1.1.0', p_chapter_id, p_chapter_id,
    coalesce(v_concept_ids, '{}'), coalesce(v_source_ids, '{}'), v_inserted_attempt.id,
    coalesce(p_event_payload ->> 'activityId', p_quiz_key), v_evidence_class,
    v_xp_awarded > 0,
    p_attempt_type = 'full_quiz' and coalesce(p_score, 0) >= 80 and v_all_independent,
    case when v_xp_awarded > 0 then 'verified_adaptive_activity' else 'activity_without_reward' end,
    v_xp_awarded, coalesce(p_event_payload, '{}'::jsonb)
  )
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_inserted_event;

  if v_inserted_event.id is null then
    raise exception 'quiz event idempotency conflict without matching attempt';
  end if;

  v_profile := private.apply_gamification_projection_v1(p_user_id, p_profile_patch, false);
  update public.gamification_profiles
  set policy_version = 'termo-gamification-policy/1.1.0'
  where user_id = p_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'ok', true, 'persisted', true, 'deduped', false,
    'attempt_id', v_inserted_attempt.id, 'event_id', v_inserted_event.event_id,
    'profile', to_jsonb(v_profile)
  );
end;
$function$;

revoke all on function public.record_chapter_quiz_attempt_atomic_v1(uuid, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_chapter_quiz_attempt_atomic_v1(uuid, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) to service_role;

comment on function public.record_chapter_quiz_attempt_atomic_v1(uuid, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb) is
  'Registra modos adaptativos T52 com idempotencia por usuario, desafio diario unico e classificacao server-side de evidencias.';
