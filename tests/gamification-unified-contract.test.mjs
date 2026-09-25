import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

function extractAuthoritativeEvents(source) {
  const block = source.match(/const EVENT_TYPES = new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(block, "allow-list autoritativa não encontrada");
  return Array.from(block[1].matchAll(/"([a-z0-9_]+)"/g), (match) => match[1]);
}

function extractTrackedEvents(source) {
  const pattern = /(?:track|trackActivation|trackAnalytics|trackActivationAnalytics|trackLegalEvent)(?:\?\.)?\s*\(\s*"([a-z0-9_]+)"/g;
  return Array.from(source.matchAll(pattern), (match) => match[1]);
}

test("contrato compartilhado tem envelope e allow-list versionados", async () => {
  const contract = await readJson("contracts/adaptive-learning-gamification-events-v1.json");
  assert.equal(contract.version, "1.0.0");
  for (const field of ["event_id", "user_id", "event_type", "occurred_at", "received_at", "idempotency_key", "policy_version"]) {
    assert.ok(contract.eventEnvelope.required.includes(field), `campo obrigatório ausente: ${field}`);
  }
  assert.equal(new Set(contract.eventTypes).size, contract.eventTypes.length);
  assert.equal(contract.invariants.analyticsCannotAward, true);
  assert.equal(contract.invariants.analyticsCannotSetMastery, true);
  assert.equal(contract.invariants.simulatorOpenIsNotLearning, true);
});

test("adapter classifica toda a allow-list autoritativa legada", async () => {
  const adapter = await readJson("data/termo-gamification-policy-v1.json");
  const contract = await readJson("contracts/adaptive-learning-gamification-events-v1.json");
  const handler = await readFile(new URL("lib/gamification-event-handler.mjs", ROOT), "utf8");
  const mapped = new Set(adapter.legacyAuthoritativeEventMappings.map((item) => item.legacyEvent));
  const sharedAllowList = new Set(contract.eventTypes);
  for (const eventName of extractAuthoritativeEvents(handler)) {
    assert.ok(mapped.has(eventName), `evento autoritativo sem classificação: ${eventName}`);
  }
  for (const mapping of adapter.legacyAuthoritativeEventMappings) {
    assert.ok(sharedAllowList.has(mapping.sharedEventType), `evento compartilhado fora do contrato: ${mapping.sharedEventType}`);
  }
  assert.ok(mapped.has("record_simulator_open"));
});

test("eventos estáticos de analytics estão classificados e não podem premiar", async () => {
  const adapter = await readJson("data/termo-gamification-policy-v1.json");
  const sources = await Promise.all([
    "assets/termo-analytics.js",
    "assets/termo-auth.js",
    "assets/ai-exercises.js",
    "assets/termo-rating.js",
    "index.html"
  ].map((path) => readFile(new URL(path, ROOT), "utf8")));
  const emitted = new Set(sources.flatMap(extractTrackedEvents));
  const mapped = new Map(adapter.analyticsEventMappings.map((item) => [item.legacyEvent, item]));
  for (const eventName of emitted) {
    assert.equal(mapped.get(eventName)?.classification, "analytics_only", `analytics sem classificação: ${eventName}`);
  }
  assert.deepEqual(adapter.analyticsEffects, {
    rewardAllowed: false,
    masteryAllowed: false,
    profileMutationAllowed: false
  });
});

test("adapter preserva valores iniciais e não recompensa retorno vazio", async () => {
  const adapter = await readJson("data/termo-gamification-policy-v1.json");
  const rewards = Object.fromEntries(adapter.rewards.map((item) => [item.key, item.points]));
  assert.deepEqual(rewards, {
    eligible_section_completion: 20,
    first_chapter_assessment: 30,
    guided_review_completion: 10,
    focused_retry_completion: 10,
    daily_challenge_correct: 10
  });
  const dailyReturn = adapter.legacyAuthoritativeEventMappings.find((item) => item.legacyEvent === "daily_return");
  assert.equal(dailyReturn.rewardAllowed, false);
  assert.ok(adapter.nonRewardedEvents.includes("daily_return"));
});

test("conteúdo bloqueado falha fechado no adapter", async () => {
  const adapter = await readJson("data/termo-gamification-policy-v1.json");
  const registry = await readJson("data/termo-editorial-registry.json");
  assert.equal(adapter.contentEligibility.failClosed, true);
  assert.ok(adapter.contentEligibility.excludedChapterIds.includes("05"));
  const blocked = registry.chapters.find((chapter) => chapter.chapterId === "05");
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.publicAvailable, false);
  assert.equal(blocked.aiExerciseEligible, false);
  assert.ok(!registry.sections.some((section) => section.chapterId === "05" && section.publicAvailable));
});
