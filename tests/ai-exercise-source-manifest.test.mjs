import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getAiExerciseSourceManifestEntry,
  isAiExerciseSourceReady
} from "../lib/ai-exercise-source-manifest.mjs";
import { validateAiExerciseSourceManifest } from "../lib/ai-exercise-source-manifest-validation.mjs";
import { buildAiExerciseContextPackage, buildAiExerciseContextPrompt } from "../lib/ai-context-package.mjs";
import { handleExerciseRequest } from "../lib/exercicio-handler.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
const [manifest, registry, corpus, topicIndex] = await Promise.all([
  readJson("data/ai-exercise-source-manifest.json"),
  readJson("data/termo-editorial-registry.json"),
  readJson("data/book-section-corpus.json"),
  readJson("data/book-topic-index.json")
]);
const clone = (value) => structuredClone(value);
const validate = (candidate, options = {}) => validateAiExerciseSourceManifest({
  rootDir,
  manifest: candidate,
  registry,
  corpus,
  topicIndex,
  ...options
});

test("manifesto cobre exatamente todas as seções editoriais elegíveis", async function () {
  const expected = registry.sections.filter((section) => section.publicAvailable && section.aiExerciseEligible);
  assert.equal(manifest.sections.length, expected.length);
  assert.equal(manifest.eligibleSectionCount, expected.length);
  assert.deepEqual(await validate(manifest), []);
});

test("helper exige fonte aprovada e completa", function () {
  assert.equal(isAiExerciseSourceReady({ chapterId: "02", itemId: "2.3" }), true);
  assert.equal(isAiExerciseSourceReady({ chapterId: "04", itemId: "4.1" }), false);
  assert.equal(getAiExerciseSourceManifestEntry({ chapterId: "02", itemId: "2.3" })?.reviewStatus, "approved");
});

test("pacote de contexto inclui o manifesto aprovado", function () {
  const context = buildAiExerciseContextPackage({
    chapterId: "02",
    itemId: "2.3",
    pagePath: "README.md",
    pageTitle: "Título enviado pelo cliente",
    pageContent: "Texto arbitrário enviado pelo navegador"
  });
  assert.equal(context.meta.sourceManifestReady, true);
  assert.equal(context.meta.sourceReviewStatus, "approved");
  assert.ok(context.primarySource);
  assert.equal(context.teachingSource.path, "slides/capitulo-02/page_3.html");
  assert.equal(context.teachingSource.title, "Energia Livre de Helmholtz");
  assert.equal(context.fallbackSource, null);
  assert.ok(context.sourceReferences.some((reference) => reference.type === "source_manifest"));
  const prompt = buildAiExerciseContextPrompt(context);
  assert.match(prompt, /Manifesto de fontes aprovado/);
  assert.doesNotMatch(prompt, /Texto arbitrário enviado pelo navegador/);
});

test("pacote de contexto falha fechado para seção fora do manifesto", function () {
  const context = buildAiExerciseContextPackage({
    chapterId: "04",
    itemId: "4.1",
    pagePath: "slides/capitulo-04/page_1.html",
    pageTitle: "Gás Real e Limites do Modelo Ideal",
    pageContent: "Conteúdo fornecido pelo navegador"
  });
  assert.equal(context.meta.sourceManifestReady, false);
  assert.equal(context.primarySource, null);
  assert.equal(context.teachingSource, null);
  assert.deepEqual(context.sourceReferences, []);
});

test("API envia ao provedor somente o contexto canônico aprovado", async function () {
  const originalFetch = globalThis.fetch;
  let capturedPrompt = "";
  globalThis.fetch = async function (_url, options = {}) {
    const payload = JSON.parse(options.body || "{}");
    capturedPrompt = payload.contents?.[0]?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify({ title: "Exercício", statement: "Explique o conceito.", solution: "Resposta conceitual." }) }]
        }
      }]
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const response = await handleExerciseRequest({
      method: "POST",
      body: {
        chapterId: "02",
        itemId: "2.3",
        pagePath: "README.md",
        pageTitle: "Título arbitrário do cliente",
        pageSubtitle: "Subtítulo arbitrário do cliente",
        pageContent: "Texto arbitrário enviado pelo navegador"
      },
      env: { GEMINI_API_KEY: "test-only-key", GEMINI_MODEL: "test-model" }
    });
    assert.equal(response.status, 200);
    assert.match(capturedPrompt, /Manifesto de fontes aprovado/);
    assert.match(capturedPrompt, /Energia Livre de Helmholtz/);
    assert.doesNotMatch(capturedPrompt, /arbitrário do cliente|Texto arbitrário enviado/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("auditoria detecta página HTML ausente", async function () {
  const candidate = clone(manifest);
  const missingUrl = candidate.sections[0].url;
  const errors = await validate(candidate, {
    pathExists: async (filePath) => !filePath.endsWith(missingUrl)
  });
  assert.ok(errors.some((error) => error.includes("página HTML inexistente")));
});

test("auditoria detecta URL editorial ausente", async function () {
  const candidate = clone(manifest);
  candidate.sections[0].url = "";
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("URL da página ausente")));
});

test("auditoria detecta referência ao livro ausente", async function () {
  const candidate = clone(manifest);
  candidate.sections[0].bookSource.references = [];
  candidate.sections[0].bookSource.referenceCount = 0;
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("referências canônicas ausentes")));
});

test("auditoria detecta fonte PDF ausente", async function () {
  const candidate = clone(manifest);
  candidate.bookPdf.fileName = "";
  candidate.sections[0].bookSource.fileName = "";
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("Fonte PDF do manifesto")));
  assert.ok(errors.some((error) => error.includes("arquivo-fonte PDF ausente")));
});

test("auditoria detecta páginas inventadas ou divergentes", async function () {
  const candidate = clone(manifest);
  candidate.sections[0].bookSource.pageStart = 999;
  candidate.sections[0].bookSource.pageEnd = 999;
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("pageStart diverge do corpus")));
});

test("auditoria detecta seção marcada para revisão", async function () {
  const candidate = clone(manifest);
  candidate.sections[0].reviewStatus = "needs_review";
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("fonte marcada para revisão")));
});

test("auditoria detecta capítulo bloqueado apresentado como elegível", async function () {
  const candidate = clone(manifest);
  candidate.sections[0].chapterId = "05";
  const errors = await validate(candidate);
  assert.ok(errors.some((error) => error.includes("capítulo bloqueado ou inelegível")));
});
