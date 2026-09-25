begin;
select plan(46);

select has_table('public', 'gamification_profiles', 'profile projection exists');
select has_table('public', 'gamification_event_log', 'immutable ledger exists');
select has_table('public', 'gamification_item_progress', 'item projection exists');
select has_table('public', 'chapter_quiz_attempts', 'quiz attempt history exists');

select ok((select relrowsecurity from pg_class where oid = 'public.gamification_profiles'::regclass), 'profile RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.gamification_event_log'::regclass), 'ledger RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.gamification_item_progress'::regclass), 'item progress RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.chapter_quiz_attempts'::regclass), 'quiz attempt RLS is enabled');

select ok(not has_table_privilege('anon', 'public.gamification_profiles', 'select,insert,update,delete'), 'anon has no profile access');
select ok(not has_table_privilege('anon', 'public.gamification_event_log', 'select,insert,update,delete'), 'anon has no ledger access');
select ok(not has_table_privilege('anon', 'public.gamification_item_progress', 'select,insert,update,delete'), 'anon has no item progress access');
select ok(not has_table_privilege('anon', 'public.chapter_quiz_attempts', 'select,insert,update,delete'), 'anon has no quiz attempt access');

select ok(has_table_privilege('authenticated', 'public.gamification_profiles', 'select'), 'authenticated can read own profile through RLS');
select ok(has_table_privilege('authenticated', 'public.gamification_event_log', 'select'), 'authenticated can read own ledger through RLS');
select ok(has_table_privilege('authenticated', 'public.gamification_item_progress', 'select'), 'authenticated can read own item progress through RLS');
select ok(has_table_privilege('authenticated', 'public.chapter_quiz_attempts', 'select'), 'authenticated can read own attempts through RLS');

select ok(not has_table_privilege('authenticated', 'public.gamification_profiles', 'insert,update,delete'), 'authenticated cannot write profiles directly');
select ok(not has_table_privilege('authenticated', 'public.gamification_event_log', 'insert,update,delete'), 'authenticated cannot write the ledger directly');
select ok(not has_table_privilege('authenticated', 'public.gamification_item_progress', 'insert,update,delete'), 'authenticated cannot write item progress directly');
select ok(not has_table_privilege('authenticated', 'public.chapter_quiz_attempts', 'insert,update,delete'), 'authenticated cannot write quiz attempts directly');

select ok(
  has_table_privilege('service_role', 'public.gamification_event_log', 'select,insert')
    and not has_table_privilege('service_role', 'public.gamification_event_log', 'update,delete'),
  'service role can append but cannot rewrite or delete ledger rows'
);
select ok(
  has_table_privilege('service_role', 'public.gamification_profiles', 'select,insert,update')
    and not has_table_privilege('service_role', 'public.gamification_profiles', 'delete'),
  'service role can maintain but not delete profile projections'
);
select ok(
  has_table_privilege('service_role', 'public.gamification_item_progress', 'select,insert,update')
    and not has_table_privilege('service_role', 'public.gamification_item_progress', 'delete'),
  'service role can maintain but not delete item projections'
);
select ok(
  has_table_privilege('service_role', 'public.chapter_quiz_attempts', 'select,insert')
    and not has_table_privilege('service_role', 'public.chapter_quiz_attempts', 'update,delete'),
  'service role can append but cannot rewrite or delete attempts'
);

select ok(not has_function_privilege('anon', 'public.apply_gamification_event_atomic_v1(uuid,text,text,date,timestamptz,text,text,integer,jsonb,jsonb,jsonb)', 'execute'), 'anon cannot execute event RPC');
select ok(not has_function_privilege('authenticated', 'public.apply_gamification_event_atomic_v1(uuid,text,text,date,timestamptz,text,text,integer,jsonb,jsonb,jsonb)', 'execute'), 'authenticated cannot execute event RPC directly');
select ok(has_function_privilege('service_role', 'public.apply_gamification_event_atomic_v1(uuid,text,text,date,timestamptz,text,text,integer,jsonb,jsonb,jsonb)', 'execute'), 'service role can execute event RPC');
select ok(not has_function_privilege('authenticated', 'public.record_chapter_quiz_attempt_atomic_v1(uuid,text,text,text,text,integer,integer,integer,integer,jsonb,jsonb,timestamptz,timestamptz,jsonb,text,text,jsonb)', 'execute'), 'authenticated cannot execute quiz RPC directly');
select ok(has_function_privilege('service_role', 'public.record_chapter_quiz_attempt_atomic_v1(uuid,text,text,text,text,integer,integer,integer,integer,jsonb,jsonb,timestamptz,timestamptz,jsonb,text,text,jsonb)', 'execute'), 'service role can execute quiz RPC');
select ok(not has_function_privilege('authenticated', 'public.reconcile_gamification_profile_v1(uuid,boolean)', 'execute'), 'authenticated cannot reconcile projections');
select ok(has_function_privilege('service_role', 'public.reconcile_gamification_profile_v1(uuid,boolean)', 'execute'), 'service role can request an explicit reconciliation');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ledger-user-1@example.test', '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ledger-user-2@example.test', '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ledger-user-3@example.test', '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  )
on conflict (id) do nothing;

set local role service_role;

select lives_ok(
  $$select public.apply_gamification_event_atomic_v1(
    '11111111-1111-1111-1111-111111111111',
    'study_item_complete',
    'study:01:1.1:test',
    '2026-09-24',
    '2026-09-24T10:00:00Z',
    '01',
    '1.1',
    20,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"chapter_id":"01","item_id":"1.1","item_key":"01:1.1","status":"studied","completed_at":"2026-09-24T10:00:00Z"}'::jsonb
  )$$,
  'service role applies the first verified event atomically'
);
select is((select count(*) from public.gamification_event_log where user_id = '11111111-1111-1111-1111-111111111111'), 1::bigint, 'first event creates one ledger row');
select is((select xp_total from public.gamification_profiles where user_id = '11111111-1111-1111-1111-111111111111'), 20, 'first event updates the profile projection');

select lives_ok(
  $$select public.apply_gamification_event_atomic_v1(
    '11111111-1111-1111-1111-111111111111',
    'study_item_complete',
    'study:01:1.1:test',
    '2026-09-24',
    '2026-09-24T10:00:00Z',
    '01',
    '1.1',
    20,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"chapter_id":"01","item_id":"1.1","item_key":"01:1.1","status":"studied","completed_at":"2026-09-24T10:00:00Z"}'::jsonb
  )$$,
  'retrying the same semantic event is safe'
);
select is((select count(*) from public.gamification_event_log where user_id = '11111111-1111-1111-1111-111111111111'), 1::bigint, 'retry does not duplicate the ledger row');
select is((select xp_total from public.gamification_profiles where user_id = '11111111-1111-1111-1111-111111111111'), 20, 'retry does not duplicate points');

select throws_ok(
  $$select public.record_chapter_quiz_attempt_atomic_v1(
    '22222222-2222-2222-2222-222222222222',
    'quiz:full_quiz:cap01:attempt',
    'cap01',
    '01',
    'full_quiz',
    80,
    4,
    5,
    30,
    '[]'::jsonb,
    '[]'::jsonb,
    '2026-09-24T11:00:00Z',
    '2026-09-24T11:05:00Z',
    '{}'::jsonb,
    'chapter_quiz_completed',
    'quiz:full_quiz:cap01:different-event',
    '{}'::jsonb
  )$$,
  'P0001',
  'event idempotency key must match attempt idempotency key',
  'quiz attempt and event must share one semantic idempotency key'
);
select is((select count(*) from public.chapter_quiz_attempts where user_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'rejected quiz call leaves no partial attempt');
select is((select count(*) from public.gamification_event_log where user_id = '22222222-2222-2222-2222-222222222222'), 0::bigint, 'rejected quiz call leaves no partial event');

insert into public.gamification_profiles (
  user_id, xp_total, legacy_xp_baseline, projection_version, policy_version
) values (
  '33333333-3333-3333-3333-333333333333', 45, 45, '1.0.0', 'termo-gamification-policy/1.0.0'
);

select lives_ok(
  $$select public.apply_gamification_event_atomic_v1(
    '33333333-3333-3333-3333-333333333333',
    'study_item_complete',
    'study:01:1.2:legacy-baseline',
    '2026-09-24',
    '2026-09-24T12:00:00Z',
    '01',
    '1.2',
    20,
    '{}'::jsonb,
    '{}'::jsonb,
    '{"chapter_id":"01","item_id":"1.2","item_key":"01:1.2","status":"studied","completed_at":"2026-09-24T12:00:00Z"}'::jsonb
  )$$,
  'a profile with a legacy baseline accepts new ledger events'
);
select is((select xp_total from public.gamification_profiles where user_id = '33333333-3333-3333-3333-333333333333'), 65, 'legacy baseline is preserved when the projection advances');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select is((select count(*) from public.gamification_event_log), 1::bigint, 'owner sees their own ledger row');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*) from public.gamification_event_log), 0::bigint, 'another user sees no ledger rows');
select throws_ok(
  $$insert into public.gamification_event_log (user_id, event_type, idempotency_key, event_day)
    values ('22222222-2222-2222-2222-222222222222', 'daily_return', 'forbidden', '2026-09-24')$$,
  '42501',
  null,
  'authenticated user cannot insert directly even into their own ledger'
);

reset role;
set local role service_role;
select is(
  (select public.reconcile_gamification_profile_v1('11111111-1111-1111-1111-111111111111', false) ->> 'mode'),
  'dry_run',
  'reconciliation is dry-run by default at the call site'
);

select * from finish();
rollback;
