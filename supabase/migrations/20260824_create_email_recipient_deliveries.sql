create table if not exists public.email_recipient_deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivery_kind text not null check (delivery_kind in ('campaign', 'return_reminder')),
  idempotency_key text not null unique,
  subject text not null,
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  reason text,
  resend_message_id text,
  sent_at timestamptz
);

create index if not exists email_recipient_deliveries_user_sent_idx
  on public.email_recipient_deliveries (user_id, sent_at desc);

create index if not exists email_recipient_deliveries_kind_sent_idx
  on public.email_recipient_deliveries (delivery_kind, sent_at desc);

alter table public.email_recipient_deliveries enable row level security;

revoke all on public.email_recipient_deliveries from anon, authenticated;
grant select, insert, update on public.email_recipient_deliveries to service_role;
