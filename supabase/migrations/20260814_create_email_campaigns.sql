create table if not exists public.email_campaigns (
  id uuid primary key,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references auth.users(id) on delete restrict,
  audience_type text not null check (audience_type in ('all_opted_in', 'selected_users')),
  recipient_count integer not null check (recipient_count >= 0),
  subject text not null,
  message text not null,
  cta_label text,
  cta_url text,
  status text not null check (status in ('sending', 'sent', 'partial_failure', 'failed')),
  delivered_count integer not null default 0 check (delivered_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  resend_message_ids jsonb not null default '[]'::jsonb
);

alter table public.email_campaigns enable row level security;

revoke all on public.email_campaigns from anon, authenticated;
grant select, insert, update on public.email_campaigns to service_role;
