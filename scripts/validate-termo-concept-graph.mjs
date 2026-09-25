import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const graph = JSON.parse(readFileSync(resolve(ROOT, "data/termo-concept-graph-v1.json"), "utf8"));
const registry = JSON.parse(readFileSync(resolve(ROOT, "data/termo-editorial-registry.json"), "utf8"));
const allowed = new Set(registry.sections
  .filter((section) => section.publicAvailable === true && section.aiExerciseEligible === true)
  .map((section) => `${section.chapterId}:${section.sectionId}`));
const errors = [];

if (graph.policy?.prerequisiteEdgesActive !== false) {
  errors.push("As arestas de pre-requisito nao podem ser ativadas antes da revisao editorial.");
}

for (const section of graph.sections || []) {
  if (section.chapterId === "05") errors.push(`Capitulo bloqueado no grafo: ${section.sectionKey}`);
  if (!allowed.has(section.sectionKey)) errors.push(`Secao nao elegivel no grafo: ${section.sectionKey}`);
  if (!existsSync(resolve(ROOT, section.url))) errors.push(`URL inexistente: ${section.url}`);
  if (!Array.isArray(section.conceptIds) || !section.conceptIds.length) errors.push(`Secao sem conceito: ${section.sectionKey}`);
  if ((section.prerequisiteIds || []).length) errors.push(`Pre-requisito nao aprovado: ${section.sectionKey}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Grafo TERMO valido: ${graph.sections.length} secoes, capitulo 05 excluido, URLs existentes.`);
}
