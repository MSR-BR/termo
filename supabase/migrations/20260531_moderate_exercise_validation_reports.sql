alter table public.saved_exercises
  add column if not exists exercise_code text;

alter table public.exercise_validation_reports
  add column if not exists exercise_id text,
  add column if not exists reporter_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reporter_email text,
  add column if not exists review_status text not null default 'pending',
  add column if not exists reviewer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_email text,
  add column if not exists reviewed_at timestamp with time zone,
  add column if not exists admin_note text;

do $$
begin
  alter table public.exercise_validation_reports
    add constraint exercise_validation_reports_review_status_check
    check (review_status in ('pending', 'approved', 'rejected'));
exception
  when duplicate_object then null;
end $$;

update public.exercise_validation_reports
set
  reporter_user_id = coalesce(reporter_user_id, validator_user_id),
  reporter_email = coalesce(reporter_email, validator_email),
  review_status = coalesce(review_status, case
    when avoid_propagation is true and ai_review_state = 'confirmed_error' then 'approved'
    else 'pending'
  end)
where reporter_user_id is null
   or reporter_email is null
   or review_status is null;

create index if not exists exercise_validation_reports_review_status_idx
on public.exercise_validation_reports (review_status, created_at desc);

create index if not exists exercise_validation_reports_exercise_id_idx
on public.exercise_validation_reports (exercise_id);

grant select, insert, update on public.exercise_validation_reports to authenticated;
grant select on public.exercise_validation_reports to anon;

drop policy if exists "Professor can insert validation reports" on public.exercise_validation_reports;
drop policy if exists "Authenticated users can report exercise validation" on public.exercise_validation_reports;
create policy "Authenticated users can report exercise validation"
on public.exercise_validation_reports
for insert
to authenticated
with check (
  coalesce(reporter_user_id, validator_user_id) = (select auth.uid())
);

drop policy if exists "Users can read own validation reports" on public.exercise_validation_reports;
create policy "Users can read own validation reports"
on public.exercise_validation_reports
for select
to authenticated
using (
  public.is_exercise_validator()
  or coalesce(reporter_user_id, validator_user_id) = (select auth.uid())
  or (avoid_propagation is true and ai_review_state = 'confirmed_error')
);

drop policy if exists "Professor can update validation reports" on public.exercise_validation_reports;
create policy "Professor can update validation reports"
on public.exercise_validation_reports
for update
to authenticated
using (public.is_exercise_validator())
with check (public.is_exercise_validator());
