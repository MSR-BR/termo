alter table public.exercise_validation_reports
  drop constraint if exists exercise_validation_reports_review_status_check;

alter table public.exercise_validation_reports
  add constraint exercise_validation_reports_review_status_check
  check (review_status in ('pending', 'approved', 'rejected', 'disabled'));
