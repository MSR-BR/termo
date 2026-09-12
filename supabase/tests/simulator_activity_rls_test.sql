begin;
select plan(17);

select has_table('public', 'simulator_activity', 'simulator_activity exists');
select col_is_pk(
  'public',
  'simulator_activity',
  array['user_id', 'simulator_id'],
  'one activity row exists per user and simulator'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.simulator_activity'::regclass),
  'RLS is enabled'
);
select ok(
  not has_table_privilege('anon', 'public.simulator_activity', 'select,insert,update,delete'),
  'anon has no table privileges'
);
select ok(
  has_table_privilege('authenticated', 'public.simulator_activity', 'select'),
  'authenticated can select through RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.simulator_activity', 'insert,update,delete'),
  'authenticated cannot write directly'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.record_simulator_open(text,text,text,text)',
    'execute'
  ),
  'anon cannot execute the recording function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.record_simulator_open(text,text,text,text)',
    'execute'
  ),
  'authenticated can execute the recording function'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'simulator-user-1@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'simulator-user-2@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","is_anonymous":false}',
  true
);

select lives_ok(
  $$select public.record_simulator_open('S01', 'termometros', 'Escalas termométricas', 'simulators/termometros.html')$$,
  'user 1 records the first opening'
);
select is(
  (select open_count from public.simulator_activity where simulator_id = 'S01'),
  1::bigint,
  'first opening starts at one'
);
select lives_ok(
  $$select public.record_simulator_open('S01', 'termometros', 'Escalas termométricas', 'simulators/termometros.html')$$,
  'user 1 records another opening'
);
select is(
  (select open_count from public.simulator_activity where simulator_id = 'S01'),
  2::bigint,
  'repeated opening increments atomically'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","is_anonymous":false}',
  true
);

select is(
  (select count(*) from public.simulator_activity),
  0::bigint,
  'user 2 cannot see user 1 activity'
);
select lives_ok(
  $$select public.record_simulator_open('S02', 'eqtermico', 'Equilíbrio térmico', 'simulators/eqtermico.html')$$,
  'user 2 records their own opening'
);
select is(
  (select count(*) from public.simulator_activity),
  1::bigint,
  'user 2 sees only their own activity'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","is_anonymous":false}',
  true
);

select is(
  (select count(*) from public.simulator_activity),
  1::bigint,
  'user 1 still sees only their own activity'
);
select is(
  (select open_count from public.simulator_activity where simulator_id = 'S01'),
  2::bigint,
  'user 1 activity remains isolated and intact'
);

select * from finish();
rollback;
