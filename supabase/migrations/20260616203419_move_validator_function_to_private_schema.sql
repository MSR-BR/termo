create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function private.is_exercise_validator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and lower(email) in ('marioreis@id.uff.br')
  );
$function$;

revoke all on function private.is_exercise_validator() from public;
grant execute on function private.is_exercise_validator() to authenticated;
grant execute on function private.is_exercise_validator() to service_role;

drop policy if exists "Users can read own validation reports" on public.exercise_validation_reports;

create policy "Users can read own validation reports"
on public.exercise_validation_reports
for select
to authenticated
using (
  (select private.is_exercise_validator())
  or coalesce(reporter_user_id, validator_user_id) = (select auth.uid())
  or (
    avoid_propagation is true
    and ai_review_state = 'confirmed_error'
    and review_status = 'approved'
  )
);

drop policy if exists "Professor can update validation reports" on public.exercise_validation_reports;

create policy "Professor can update validation reports"
on public.exercise_validation_reports
for update
to authenticated
using ((select private.is_exercise_validator()))
with check ((select private.is_exercise_validator()));

drop function if exists public.is_exercise_validator();
