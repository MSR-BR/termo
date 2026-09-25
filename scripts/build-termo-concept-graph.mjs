import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function readJson(path) {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
}

const registry = readJson("data/termo-editorial-registry.json");
const manifest = readJson("data/ai-exercise-source-manifest.json");
const taxonomy = readJson("data/book-topic-taxonomy.json");
const publicSections = new Map(registry.sections
  .filter((section) => section.publicAvailable === true && section.aiExerciseEligible === true)
  .map((section) => [`${section.chapterId}:${section.sectionId}`, section]));
const topicLabels = new Map((taxonomy.transversalTopics || []).map((topic) => [topic.id, topic.label]));
const conceptMap = new Map();

function ensureConcept(id, fallbackLabel, kind) {
  if (!id || conceptMap.has(id)) return;
  conceptMap.set(id, {
    conceptId: id,
    label: topicLabels.get(id) || fallbackLabel || id,
    kind,
    prerequisiteIds: [],
    prerequisiteReviewStatus: "pending_editorial_review"
  });
}

const sections = manifest.sections
  .filter((section) => section.eligible === true)
  .filter((section) => section.chapterId !== "05")
  .filter((section) => publicSections.has(`${section.chapterId}:${section.sectionId}`))
  .map((section) => {
    const thematic = section.thematicReference || {};
    const conceptIds = Array.from(new Set([
      thematic.primaryTopic,
      ...(thematic.transversalTopics || []),
      ...(thematic.advancedSupportTopics || [])
    ].filter(Boolean)));
    ensureConcept(thematic.primaryTopic, section.title, "primary");
    (thematic.transversalTopics || []).forEach((id) => ensureConcept(id, id, "transversal"));
    (thematic.advancedSupportTopics || []).forEach((id) => ensureConcept(id, id, "advanced_support"));

    const sourceIds = (section.bookSource?.references || []).map((reference) => reference.id).filter(Boolean);
    const representations = ["published_html_section", "book_reference"];
    if (/^exemplo:/i.test(section.title || "")) representations.push("worked_example");

    return {
      sectionKey: `${section.chapterId}:${section.sectionId}`,
      chapterId: section.chapterId,
      chapterTitle: section.chapterTitle,
      sectionId: section.sectionId,
      title: section.title,
      url: section.url,
      conceptIds,
      primaryConceptId: thematic.primaryTopic || "",
      sourceIds,
      representations,
      prerequisiteIds: [],
      prerequisiteReviewStatus: "pending_editorial_review"
    };
  });

const graph = {
  schemaVersion: 1,
  graphId: "termo-concept-graph",
  version: "1.0.0",
  status: "generated_pending_prerequisite_review",
  generatedAt: new Date().toISOString(),
  sources: {
    editorialRegistry: "data/termo-editorial-registry.json",
    exerciseManifest: "data/ai-exercise-source-manifest.json",
    topicTaxonomy: "data/book-topic-taxonomy.json"
  },
  policy: {
    failClosed: true,
    excludedChapterIds: ["05"],
    prerequisiteEdgesActive: false,
    note: "Nenhum pre-requisito foi inferido. As arestas permanecem vazias ate revisao editorial humana."
  },
  concepts: Array.from(conceptMap.values()).sort((left, right) => left.conceptId.localeCompare(right.conceptId)),
  sections
};

writeFileSync(
  resolve(ROOT, "data/termo-concept-graph-v1.json"),
  `${JSON.stringify(graph, null, 2)}\n`,
  "utf8"
);

console.log(`Grafo TERMO gerado: ${graph.concepts.length} conceitos, ${graph.sections.length} secoes elegiveis.`);
