import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getEditorialSection, isAiExerciseEligible } from "../lib/editorial-registry.mjs";
import { handleExerciseRequest } from "../lib/exercicio-handler.mjs";
import { listAiQuizChapterSummaries } from "../lib/gamification-ai-quiz.mjs";

const registry = JSON.parse(await readFile(new URL("../data/termo-editorial-registry.json", import.meta.url), "utf8"));
const searchIndex = JSON.parse(await readFile(new URL("../data/termo-published-search-index.json", import.meta.url), "utf8"));

test("capítulo 5 permanece bloqueado em todas as dimensões", function () {
  const chapter = registry.chapters.find((entry) => entry.chapterId === "05");
  assert.ok(chapter);
  assert.equal(chapter.status, "blocked");
  assert.equal(chapter.publicAvailable, false);
  assert.equal(chapter.searchEligible, false);
  assert.equal(chapter.seoEligible, false);
  assert.equal(chapter.aiExerciseEligible, false);
  assert.ok(chapter.blockedReason);
});

test("índice público corresponde exatamente às seções elegíveis", function () {
  const expected = registry.sections
    .filter((section) => section.publicAvailable && section.searchEligible)
    .map((section) => section.sectionId)
    .sort();
  const actual = searchIndex.sections.map((section) => section.sectionId).sort();
  assert.deepEqual(actual, expected);
});

test("helper editorial diferencia seções elegíveis e não elegíveis", function () {
  assert.equal(isAiExerciseEligible({ chapterId: "02", itemId: "2.3" }), true);
  assert.equal(isAiExerciseEligible({ chapterId: "06", itemId: "6.9" }), false);
  assert.equal(isAiExerciseEligible({ chapterId: "05", itemId: "5.1" }), false);
  assert.equal(getEditorialSection({ chapterId: "02", itemId: "2.3" })?.sectionId, "2.3");
});

test("API rejeita conteúdo bloqueado antes de chamar o provedor IA", async function () {
  const response = await handleExerciseRequest({
    method: "POST",
    body: { chapterId: "05", itemId: "5.1", pagePath: "slides/capitulo-05/page_1.html" },
    env: {}
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.reason, "section_not_ai_eligible");
});

test("API rejeita seção pública sem elegibilidade editorial para IA", async function () {
  const response = await handleExerciseRequest({
    method: "POST",
    body: { chapterId: "06", itemId: "6.9", pagePath: "slides/capitulo-06/page_9.html" },
    env: {}
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.reason, "section_not_ai_eligible");
});

test("catálogo de simulados IA segue os capítulos elegíveis do registry", function () {
  const expected = registry.chapters
    .filter((chapter) => chapter.publicAvailable && chapter.aiExerciseEligible && chapter.sectionCount > 0)
    .map((chapter) => chapter.chapterId);
  const actual = listAiQuizChapterSummaries().map((chapter) => chapter.chapterId);
  assert.deepEqual(actual, expected);
  assert.equal(actual.includes("05"), false);
});
