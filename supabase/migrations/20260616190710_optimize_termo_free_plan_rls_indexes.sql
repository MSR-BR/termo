create index if not exists exercise_validation_reports_validator_user_id_idx
  on public.exercise_validation_reports (validator_user_id)
  where validator_user_id is not null;

create index if not exists exercise_validation_reports_reporter_user_id_idx
  on public.exercise_validation_reports (reporter_user_id)
  where reporter_user_id is not null;

create index if not exists exercise_validation_reports_reviewer_user_id_idx
  on public.exercise_validation_reports (reviewer_user_id)
  where reviewer_user_id is not null;

create index if not exists exercise_validation_reports_saved_exercise_id_idx
  on public.exercise_validation_reports (saved_exercise_id)
  where saved_exercise_id is not null;

drop policy if exists "Anyone can read confirmed validation memory" on public.exercise_validation_reports;

create policy "Anon can read confirmed validation memory"
on public.exercise_validation_reports
for select
to anon
using (
  avoid_propagation is true
  and ai_review_state = 'confirmed_error'
  and review_status = 'approved'
);

drop policy if exists "Users can read own validation reports" on public.exercise_validation_reports;

create policy "Users can read own validation reports"
on public.exercise_validation_reports
for select
to authenticated
using (
  (select public.is_exercise_validator())
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
using ((select public.is_exercise_validator()))
with check ((select public.is_exercise_validator()));
