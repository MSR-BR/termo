import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260924124810_termo_gamification_ledger_v1.sql"
);
const migration = readFileSync(migrationPath, "utf8");
const sharedSource = readFileSync(resolve(process.cwd(), "lib/gamification-shared.mjs"), "utf8");

test("ledger migration scopes idempotency to the authenticated subject", function () {
  assert.match(migration, /unique index if not exists gamification_event_log_user_idempotency_uidx\s+on public\.gamification_event_log \(user_id, idempotency_key\)/);
  assert.match(migration, /where user_id = p_user_id and idempotency_key = p_idempotency_key/);
  assert.match(migration, /drop constraint if exists gamification_event_log_idempotency_key_key/);
});

test("ledger is append-only for Data API roles", function () {
  assert.match(migration, /grant select, insert on table public\.gamification_event_log to service_role/);
  assert.doesNotMatch(migration, /grant[^;]*update[^;]*gamification_event_log[^;]*service_role/i);
  assert.doesNotMatch(migration, /grant[^;]*delete[^;]*gamification_event_log/i);
  assert.match(migration, /revoke all on table public\.gamification_event_log from public, anon, authenticated, service_role/);
});

test("browser roles cannot call authoritative write RPCs", function () {
  assert.match(migration, /revoke all on function public\.apply_gamification_event_atomic_v1[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /revoke all on function public\.record_chapter_quiz_attempt_atomic_v1[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.apply_gamification_event_atomic_v1[\s\S]*to service_role/);
});

test("daily return remains observable but cannot award new points", function () {
  assert.match(migration, /case when p_event_type = 'daily_return' then 0/);
  assert.match(migration, /event_type <> 'daily_return'/);
});

test("profile snapshot is versioned and does not expose learner email", function () {
  assert.match(sharedSource, /termo-gamification-profile\/1\.1\.0/);
  assert.match(sharedSource, /ledgerCursor/);
  assert.doesNotMatch(sharedSource, /email:\s*user\.email/);
});

test("reconciliation defaults to dry-run", function () {
  assert.match(migration, /create or replace function public\.reconcile_gamification_profile_v1/);
  assert.match(migration, /p_apply boolean default false/);
  assert.match(migration, /case when p_apply then 'apply' else 'dry_run' end/);
});

test("quiz attempt and ledger event remain one atomic idempotent unit", function () {
  assert.match(migration, /event idempotency key must match attempt idempotency key/);
  assert.match(migration, /quiz event idempotency conflict without matching attempt/);
});

test("legacy baselines cover profiles even when they have no ledger rows", function () {
  assert.match(migration, /update public\.gamification_profiles as profiles\s+set legacy_xp_baseline/);
  assert.match(migration, /where events\.user_id = profiles\.user_id/);
  assert.doesNotMatch(migration, /from rewarded\s+full join studied/);
});

test("legacy item progress gains a ledger source reference", function () {
  assert.match(
    migration,
    /alter table public\.gamification_item_progress\s+add column if not exists source_event_id bigint references public\.gamification_event_log\(id\) on delete set null/,
  );
});
