import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { validateAiExerciseSourceManifest } from "../lib/ai-exercise-source-manifest-validation.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
const [manifest, registry, corpus, topicIndex] = await Promise.all([
  readJson("data/ai-exercise-source-manifest.json"),
  readJson("data/termo-editorial-registry.json"),
  readJson("data/book-section-corpus.json"),
  readJson("data/book-topic-index.json")
]);
const [exerciseHandler, contextPackage, referenceBuilder] = await Promise.all([
  readFile(path.join(rootDir, "lib", "exercicio-handler.mjs"), "utf8"),
  readFile(path.join(rootDir, "lib", "ai-context-package.mjs"), "utf8"),
  readFile(path.join(rootDir, "scripts", "build-ai-exercise-index-page.mjs"), "utf8")
]);

const errors = await validateAiExerciseSourceManifest({ rootDir, manifest, registry, corpus, topicIndex });
if (!exerciseHandler.includes("isAiExerciseSourceReady")) {
  errors.push("API de exercícios não exige manifesto de fontes aprovado.");
}
if (!exerciseHandler.includes('const pageContentForPrompt = contextPrompt ? "" : pageContent;')) {
  errors.push("Prompt ainda pode misturar conteúdo enviado pelo cliente com fontes aprovadas.");
}
if (!exerciseHandler.includes('params.set("avoid_propagation", "eq.true")') || !exerciseHandler.includes('params.set("review_status", "eq.approved")')) {
  errors.push("Memória de correções aprovadas não está preservada no fluxo de geração.");
}
if (!contextPackage.includes("getAiExerciseSourceManifestEntry") || !contextPackage.includes("sourceManifestReady")) {
  errors.push("Pacote de contexto não está vinculado ao manifesto de fontes.");
}
if (!referenceBuilder.includes("ai-exercise-source-manifest.json")) {
  errors.push("Página técnica de referências não deriva do manifesto de fontes.");
}
if (errors.length) {
  console.error("Auditoria do manifesto de fontes falhou:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Manifesto de fontes válido: ${manifest.sections.length} seções elegíveis, revisadas e com proveniência verificável.`);
