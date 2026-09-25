import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const policy = JSON.parse(await readFile(new URL("../data/termo-evaluation-communication-policy-v1.json", import.meta.url), "utf8"));
const analytics = await readFile(new URL("../assets/termo-analytics.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20260925181046_termo_evaluation_communication_v1.sql", import.meta.url), "utf8");
const privacy = await readFile(new URL("../privacidade.html", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const auth = await readFile(new URL("../assets/termo-auth.js", import.meta.url), "utf8");

test("policy separates the five evaluation layers and six fidelity stages", function () {
  assert.deepEqual(policy.layers.map(function (layer) { return layer.id; }), [
    "learning", "behavior", "experience", "fidelity", "equity_safety"
  ]);
  assert.deepEqual(policy.fidelityStages, [
    "eligibility", "exposure", "action", "reward", "duplicate_suppression", "opt_out"
  ]);
  policy.mechanics.forEach(function (mechanic) {
    policy.fidelityStages.forEach(function (stage) { assert.ok(mechanic[stage], `${mechanic.id}:${stage}`); });
  });
});

test("academic claims remain gated by baseline, delayed retention and changed form", function () {
  assert.equal(policy.researchPlan.baseline.required, true);
  assert.equal(policy.researchPlan.retention.required, true);
  assert.ok(policy.researchPlan.retention.minimumDelayDays >= 7);
  assert.equal(policy.researchPlan.transfer.required, true);
  assert.match(policy.researchPlan.claimGate, /não ganho causal/i);
});

test("GA4 remains unable to award points or set mastery", function () {
  assert.equal(policy.privacy.ga4CanAwardPoints, false);
  assert.equal(policy.privacy.ga4CanSetMastery, false);
  assert.doesNotMatch(analytics, /gtag\([^)]*(?:xp_delta|reward_eligible|mastery_eligible)/i);
});

test("communication defaults to opt-out and exposes pause and passwordless unsubscribe", function () {
  assert.match(migration, /alter column email_updates_opted_in set default false/);
  assert.match(migration, /email_unsubscribe_token uuid not null default gen_random_uuid\(\)/);
  assert.match(auth, /Pausar e-mails por 30 dias/);
  assert.match(privacy, /A preferência começa desligada/);
  assert.equal(policy.communication.productWorksWithoutMessages, true);
  assert.equal(policy.communication.unsubscribeWithoutLogin, true);
});

test("admin evaluation view is explicit about aggregation and causal limits", function () {
  assert.match(index, /Avaliação e qualidade/);
  assert.match(index, /Não é uma prova causal de aprendizagem/);
  assert.match(index, /Contagens pequenas aparecem/);
});
