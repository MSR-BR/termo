import assert from "node:assert/strict";
import test from "node:test";

import { handleExerciseRequest } from "../lib/exercicio-handler.mjs";
import { generateAiChapterQuiz } from "../lib/gamification-ai-quiz.mjs";
import { buildGeminiGenerationConfig } from "../lib/gemini-generation-config.mjs";

const exerciseBody = {
  chapterId: "02",
  itemId: "2.3",
  pagePath: "slides/capitulo-02/page_3.html"
};

async function withGeminiFetch(mock, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("Gemini 2.5 conserva a temperatura; 3.x e aliases não a enviam", function () {
  assert.deepEqual(buildGeminiGenerationConfig({ model: "gemini-2.5-flash", temperature: 0.72 }), {
    responseMimeType: "application/json",
    temperature: 0.72
  });
  assert.deepEqual(buildGeminiGenerationConfig({ model: "gemini-2.5-flash-lite", temperature: 0.1 }), {
    responseMimeType: "application/json",
    temperature: 0.1
  });
  for (const model of ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest", "test-model"]) {
    const config = buildGeminiGenerationConfig({ model, temperature: 0.35 });
    assert.deepEqual(config, { responseMimeType: "application/json" });
    assert.doesNotMatch(JSON.stringify(config), /temperature|topP|topK|top_p|top_k|thinkingBudget|thinking_budget|thinkingLevel|thinking_level/);
  }
});

test("exercício envia o corpo correto para 2.5 e 3.8 sem acessar Gemini", async function () {
  for (const model of ["gemini-2.5-flash", "gemini-3.8-flash"]) {
    const requests = [];
    const response = await withGeminiFetch(async function (url, options) {
      requests.push({ url: String(url), body: JSON.parse(options.body) });
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          title: "Exercício", statement: "Explique o conceito.", solution: "Resposta conceitual."
        }) }] } }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }, () => handleExerciseRequest({
      method: "POST",
      body: exerciseBody,
      env: { GEMINI_API_KEY: "test-only-key", GEMINI_MODEL: model }
    }));

    assert.equal(response.status, 200);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, new RegExp(`${model}:generateContent$`));
    assert.equal(requests[0].body.generationConfig.responseMimeType, "application/json");
    assert.equal(requests[0].body.generationConfig.temperature, model.includes("2.5") ? 0.7 : undefined);
    assert.equal(requests[0].body.generationConfig.thinkingConfig, undefined);
  }
});

test("erro 400 simulado mantém diagnóstico e aplica configuração por modelo no fallback", async function () {
  const requests = [];
  const response = await withGeminiFetch(async function (url, options) {
    requests.push({ url: String(url), body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ error: { message: "Unsupported generation parameter" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }, () => handleExerciseRequest({
    method: "POST",
    body: exerciseBody,
    env: { GEMINI_API_KEY: "test-only-key", GEMINI_MODEL: "gemini-3.8-flash" }
  }));

  assert.equal(response.status, 400);
  assert.equal(response.body.reason, "gemini_generation_failed");
  assert.equal(requests[0].body.generationConfig.temperature, undefined);
  assert.ok(requests.some((request) => request.url.includes("gemini-2.5-flash:generateContent")
    && request.body.generationConfig.temperature === 0.7));
  assert.ok(requests.every((request) => request.body.generationConfig.thinkingConfig === undefined));
});

test("simulado omite amostragem em 3.8 e trata erro 400 simulado", async function () {
  const requests = [];
  const originalWarn = console.warn;
  console.warn = function () {};
  try {
    const result = await withGeminiFetch(async function (url, options) {
      requests.push({ url: String(url), body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ error: { message: "Unsupported generation parameter" } }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }, () => generateAiChapterQuiz({
      chapterId: "01",
      stage: "during",
      env: { GEMINI_API_KEY: "test-only-key", GEMINI_MODEL: "gemini-3.8-flash" }
    }));

    assert.equal(result.ok, false);
    assert.equal(result.status, 502);
    assert.equal(result.errorCode, "provider_request_failed");
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body.generationConfig, { responseMimeType: "application/json" });
  } finally {
    console.warn = originalWarn;
  }
});

test("simulado conserva a temperatura específica da etapa no Gemini 2.5", async function () {
  const requests = [];
  const originalWarn = console.warn;
  console.warn = function () {};
  try {
    await withGeminiFetch(async function (url, options) {
      requests.push({ url: String(url), body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ error: { message: "Erro simulado" } }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }, () => generateAiChapterQuiz({
      chapterId: "01",
      stage: "during",
      env: { GEMINI_API_KEY: "test-only-key", GEMINI_MODEL: "gemini-2.5-flash" }
    }));

    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.generationConfig.temperature, 0.72);
    assert.equal(requests[0].body.generationConfig.thinkingConfig, undefined);
  } finally {
    console.warn = originalWarn;
  }
});
