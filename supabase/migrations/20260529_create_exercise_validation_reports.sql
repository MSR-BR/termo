create table if not exists public.exercise_validation_reports (
  id uuid primary key default gen_random_uuid(),
  validator_user_id uuid references auth.users(id) on delete set null,
  validator_email text not null,
  saved_exercise_id uuid references public.saved_exercises(id) on delete set null,
  chapter_id text,
  item_id text,
  page_path text not null,
  page_url text not null,
  page_title text not null,
  exercise_title text not null,
  exercise_fingerprint text not null,
  statement_excerpt text not null,
  solution_excerpt text not null,
  statement_status text not null check (statement_status in ('sim', 'nao', 'nao_sei')),
  solution_status text not null check (solution_status in ('sim', 'nao', 'nao_sei')),
  statement_note text,
  solution_note text,
  ai_review_state text not null check (ai_review_state in ('no_issue_reported', 'confirmed_error', 'not_confirmed', 'inconclusive')),
  ai_review_summary text not null default '',
  ai_correction_advice text not null default '',
  avoid_propagation boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists exercise_validation_reports_topic_idx
  on public.exercise_validation_reports (chapter_id, item_id, created_at desc);

create index if not exists exercise_validation_reports_page_idx
  on public.exercise_validation_reports (page_path, created_at desc);

create index if not exists exercise_validation_reports_memory_idx
  on public.exercise_validation_reports (avoid_propagation, ai_review_state, created_at desc);

create or replace function public.set_exercise_validation_reports_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists exercise_validation_reports_set_updated_at on public.exercise_validation_reports;

create trigger exercise_validation_reports_set_updated_at
before update on public.exercise_validation_reports
for each row
execute function public.set_exercise_validation_reports_updated_at();

alter table public.exercise_validation_reports enable row level security;

drop policy if exists "Anyone can read confirmed validation memory" on public.exercise_validation_reports;
create policy "Anyone can read confirmed validation memory"
on public.exercise_validation_reports
for select
to anon, authenticated
using (avoid_propagation is true and ai_review_state = 'confirmed_error');

create or replace function public.is_exercise_validator()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and lower(email) in ('marioreis@id.uff.br')
  );
$$;

drop policy if exists "Professor can insert validation reports" on public.exercise_validation_reports;
create policy "Professor can insert validation reports"
on public.exercise_validation_reports
for insert
to authenticated
with check (
  public.is_exercise_validator()
);
