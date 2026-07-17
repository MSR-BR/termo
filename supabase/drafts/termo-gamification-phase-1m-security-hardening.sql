-- TERMO Gamification Phase 1M Security Hardening
-- Date: July 17, 2026
--
-- Purpose:
-- - keep learners able to read their own gamification data
-- - prevent direct client-side writes to progress, event and quiz attempt tables
-- - keep all writes behind the TERMO API handlers, which validate auth, payloads and scoring

revoke insert on public.gamification_event_log from authenticated;
revoke insert, update on public.gamification_item_progress from authenticated;
revoke insert on public.chapter_quiz_attempts from authenticated;
revoke usage, select on sequence public.gamification_event_log_id_seq from authenticated;

drop policy if exists "Users can insert their own gamification event log" on public.gamification_event_log;
drop policy if exists "Users can insert their own item progress" on public.gamification_item_progress;
drop policy if exists "Users can update their own item progress" on public.gamification_item_progress;
drop policy if exists "Users can insert their own quiz attempts" on public.chapter_quiz_attempts;
