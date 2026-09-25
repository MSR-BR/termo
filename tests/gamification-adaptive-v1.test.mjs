import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildAdaptiveNextAction,
  enrichFeedbackWithEvidence,
  evaluateChapterMastery,
  getConceptGraph
} from "../lib/gamification-adaptive-v1.mjs";

test("grafo adaptativo falha fechado e exclui o capitulo 05", function () {
  const graph = getConceptGraph();
  assert.equal(graph.policy.prerequisiteEdgesActive, false);
  assert.ok(graph.sections.length > 0);
  assert.ok(graph.sections.every((section) => section.chapterId !== "05"));
  assert.ok(graph.sections.every((section) => section.prerequisiteIds.length === 0));
});

test("capacidades de simulador nao confundem abertura com aprendizagem", async function () {
  const capabilities = JSON.parse(await readFile(new URL("../data/termo-simulator-capabilities-v1.json", import.meta.url), "utf8"));
  assert.equal(capabilities.policy.openingAwardsPoints, false);
  assert.equal(capabilities.policy.openingCountsForMastery, false);
  assert.equal(capabilities.defaultCapabilities.rewardEligible, false);
  assert.equal(capabilities.defaultCapabilities.masteryEligible, false);
  assert.equal(capabilities.simulators.find((item) => item.id === "S07").sourceEligible, false);
});

test("evidencia distingue erro, baixa confianca, ajuda e solucao revelada", function () {
  const base = [{
    questionId: "q1",
    isCorrect: true,
    reviewItem: "1.1",
    reviewTitle: "Lei Zero",
    reviewPath: "slides/capitulo-01/page_2.html"
  }];

  assert.equal(enrichFeedbackWithEvidence({
    chapterId: "01",
    feedback: base,
    answers: [{ questionId: "q1", confidence: "low" }]
  })[0].evidenceClass, "correct_low_confidence");
  assert.equal(enrichFeedbackWithEvidence({
    chapterId: "01",
    feedback: base,
    answers: [{ questionId: "q1", helpUsed: true }]
  })[0].evidenceClass, "correct_with_help");
  assert.equal(enrichFeedbackWithEvidence({
    chapterId: "01",
    feedback: base,
    answers: [{ questionId: "q1", solutionRevealed: true }]
  })[0].evidenceClass, "solution_revealed");
});

test("um unico simulado nunca declara dominio", function () {
  const mastery = evaluateChapterMastery([{
    quiz_key: "form-a",
    chapter_id: "01",
    attempt_type: "full_quiz",
    score: 100,
    completed_at: "2026-09-24T10:00:00.000Z",
    feedback: [{ isCorrect: true, masteryEligible: true }]
  }], "01");
  assert.equal(mastery.mastered, false);
  assert.equal(mastery.qualifyingRetrievals, 1);
});

test("dominio exige recuperacoes em dias e formas diferentes", function () {
  const mastery = evaluateChapterMastery([
    {
      quiz_key: "form-a",
      chapter_id: "01",
      attempt_type: "full_quiz",
      score: 80,
      completed_at: "2026-09-24T10:00:00.000Z",
      feedback: [{ isCorrect: true, masteryEligible: true }, { isCorrect: false, masteryEligible: false }]
    },
    {
      quiz_key: "form-b",
      chapter_id: "01",
      attempt_type: "full_quiz",
      score: 100,
      completed_at: "2026-09-25T10:00:00.000Z",
      feedback: [{ isCorrect: true, masteryEligible: true }]
    }
  ], "01");
  assert.equal(mastery.mastered, true);
});

test("proxima acao explica motivo, fonte, duracao e alternativa", function () {
  const action = buildAdaptiveNextAction({
    chapterId: "01",
    missedFeedback: [{
      reviewItem: "1.1",
      reviewTitle: "Lei Zero",
      reviewPath: "slides/capitulo-01/page_2.html",
      reviewWhy: "Rever equilibrio termico."
    }]
  });
  assert.ok(action.reason);
  assert.ok(action.source);
  assert.ok(action.estimatedMinutes > 0);
  assert.ok(action.alternative?.href);
});

test("migracao T52 separa desafio diario e restringe escrita ao servidor", async function () {
  const migration = await readFile(new URL("../supabase/migrations/20260925162106_termo_adaptive_modes_v1.sql", import.meta.url), "utf8");
  assert.match(migration, /daily_challenge_completed/);
  assert.match(migration, /daily_challenge/);
  assert.match(migration, /gamification_event_log_one_daily_challenge_uidx/);
  assert.match(migration, /p_completed_at at time zone 'UTC'/);
  assert.match(migration, /revoke all on function public\.record_chapter_quiz_attempt_atomic_v1[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.record_chapter_quiz_attempt_atomic_v1[\s\S]*to service_role/);
});
