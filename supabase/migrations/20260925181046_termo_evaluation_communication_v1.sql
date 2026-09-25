-- TERMO T54 — avaliação acadêmica e comunicação responsável v1
--
-- A migração torna o consentimento de novidades afirmativo, oferece pausa e
-- descadastro sem login por token opaco e preserva as tabelas como server-only.

alter table public.user_legal_preferences
  alter column email_updates_opted_in set default false;

alter table public.user_legal_preferences
  add column if not exists email_updates_paused_until timestamptz,
  add column if not exists email_unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists user_legal_preferences_unsubscribe_token_uidx
  on public.user_legal_preferences (email_unsubscribe_token);

-- Registros legados ligados pelo default antigo, sem timestamp de opt-in
-- afirmativo, não constituem autorização verificável para novos envios.
update public.user_legal_preferences
set
  email_updates_opted_in = false,
  email_updates_opted_out_at = coalesce(email_updates_opted_out_at, timezone('utc', now())),
  email_updates_paused_until = null
where email_updates_opted_in is true
  and email_updates_opted_in_at is null;

alter table public.user_legal_preferences enable row level security;
revoke all on table public.user_legal_preferences from public, anon, authenticated;
grant select, insert, update on table public.user_legal_preferences to service_role;

comment on column public.user_legal_preferences.email_updates_paused_until is
  'Pausa opcional de mensagens; destinatários pausados não entram em campanhas.';
comment on column public.user_legal_preferences.email_unsubscribe_token is
  'Token opaco para descadastro sem login; nunca deve ser enviado a analytics.';
