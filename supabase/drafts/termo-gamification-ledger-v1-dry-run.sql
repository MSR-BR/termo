-- T51 — reconciliação somente leitura do ledger v1
--
-- Execute apenas depois de confirmar o projeto TERMO correto.
-- Este arquivo não altera dados. A coluna `status` destaca diferenças entre a
-- projeção persistida e a projeção calculada pelo ledger.

with projected as (
  select
    profiles.user_id,
    profiles.xp_total as stored_xp_total,
    profiles.studied_items_count as stored_studied_items_count,
    profiles.chapters_mastered_count as stored_chapters_mastered_count,
    profiles.ledger_cursor as stored_ledger_cursor,
    private.gamification_projection_v1(profiles.user_id) as expected
  from public.gamification_profiles as profiles
),
comparison as (
  select
    user_id,
    stored_xp_total,
    (expected ->> 'xp_total')::integer as expected_xp_total,
    stored_studied_items_count,
    (expected ->> 'studied_items_count')::integer as expected_studied_items_count,
    stored_chapters_mastered_count,
    (expected ->> 'chapters_mastered_count')::integer as expected_chapters_mastered_count,
    stored_ledger_cursor,
    (expected ->> 'ledger_cursor')::bigint as expected_ledger_cursor
  from projected
)
select
  count(*)::integer as profiles_checked,
  count(*) filter (
    where stored_xp_total = expected_xp_total
      and stored_studied_items_count = expected_studied_items_count
      and stored_chapters_mastered_count = expected_chapters_mastered_count
      and stored_ledger_cursor = expected_ledger_cursor
  )::integer as profiles_consistent,
  count(*) filter (
    where stored_xp_total <> expected_xp_total
      or stored_studied_items_count <> expected_studied_items_count
      or stored_chapters_mastered_count <> expected_chapters_mastered_count
      or stored_ledger_cursor <> expected_ledger_cursor
  )::integer as profiles_with_difference,
  coalesce(sum(expected_xp_total), 0)::integer as expected_xp_total_sum,
  coalesce(sum(stored_xp_total), 0)::integer as stored_xp_total_sum
from comparison;

-- Detalhe sem e-mail, respostas ou qualquer outro dado pessoal:
with projected as (
  select
    profiles.user_id,
    profiles.xp_total as stored_xp_total,
    profiles.studied_items_count as stored_studied_items_count,
    profiles.chapters_mastered_count as stored_chapters_mastered_count,
    profiles.ledger_cursor as stored_ledger_cursor,
    private.gamification_projection_v1(profiles.user_id) as expected
  from public.gamification_profiles as profiles
)
select
  encode(digest(user_id::text, 'sha256'), 'hex') as anonymized_user_id,
  stored_xp_total,
  (expected ->> 'xp_total')::integer as expected_xp_total,
  stored_studied_items_count,
  (expected ->> 'studied_items_count')::integer as expected_studied_items_count,
  stored_chapters_mastered_count,
  (expected ->> 'chapters_mastered_count')::integer as expected_chapters_mastered_count,
  stored_ledger_cursor,
  (expected ->> 'ledger_cursor')::bigint as expected_ledger_cursor
from projected
where stored_xp_total <> (expected ->> 'xp_total')::integer
   or stored_studied_items_count <> (expected ->> 'studied_items_count')::integer
   or stored_chapters_mastered_count <> (expected ->> 'chapters_mastered_count')::integer
   or stored_ledger_cursor <> (expected ->> 'ledger_cursor')::bigint
order by anonymized_user_id;
