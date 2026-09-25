-- TERMO T51 — kill switch não destrutivo do ledger v1
--
-- Usar somente se o rollout remoto já tiver ocorrido e a variável
-- TERMO_GAMIFICATION_LEDGER_V1 já tiver sido removida/desativada no runtime.
-- Este pacote não apaga tabelas, eventos, tentativas, projeções ou histórico.

begin;

revoke execute on function public.apply_gamification_event_atomic_v1(
  uuid, text, text, date, timestamptz, text, text, integer, jsonb, jsonb, jsonb
) from service_role;

revoke execute on function public.record_chapter_quiz_attempt_atomic_v1(
  uuid, text, text, text, text, integer, integer, integer, integer,
  jsonb, jsonb, timestamptz, timestamptz, jsonb, text, text, jsonb
) from service_role;

revoke execute on function public.reconcile_gamification_profile_v1(
  uuid, boolean
) from service_role;

commit;
