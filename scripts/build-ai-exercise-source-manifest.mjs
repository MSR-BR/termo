import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(rootDir, "data", "termo-editorial-registry.json");
const corpusPath = path.join(rootDir, "data", "book-section-corpus.json");
const topicIndexPath = path.join(rootDir, "data", "book-topic-index.json");
const outputPath = path.join(rootDir, "data", "ai-exercise-source-manifest.json");

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const registry = await readJson(registryPath);
const corpus = await readJson(corpusPath);
const topicIndex = await readJson(topicIndexPath);
const corpusBySection = new Map((corpus.sections || []).map((section) => [section.itemId, section]));
const topicBySection = new Map((topicIndex.sectionIndex || []).map((section) => [section.sectionId, section]));
const chapterById = new Map((registry.chapters || []).map((chapter) => [chapter.chapterId, chapter]));
const pdfFileName = path.basename(String(corpus.pdfSource || ""));

function normalizeReference(reference = {}) {
  return {
    id: String(reference.id || "").trim(),
    label: String(reference.label || "").trim(),
    pdfChapterNumber: String(reference.pdfChapterNumber || "").trim(),
    pdfChapterTitle: String(reference.pdfChapterTitle || "").trim(),
    pageStart: Number(reference.pageStart || 0) || 0,
    pageEnd: Number(reference.pageEnd || 0) || 0,
    extractionSources: Array.isArray(reference.extractionSources) ? reference.extractionSources.map(String) : [],
    needsReview: Boolean(reference.needsReview)
  };
}

const sections = (registry.sections || [])
  .filter((section) => section.publicAvailable && section.aiExerciseEligible)
  .map((section) => {
    const chapter = chapterById.get(section.chapterId) || {};
    const bookSection = corpusBySection.get(section.sectionId) || {};
    const topicSection = topicBySection.get(section.sectionId) || {};
    const references = Array.isArray(bookSection.references)
      ? bookSection.references.map(normalizeReference)
      : [];

    return {
      chapterId: section.chapterId,
      chapterTitle: String(chapter.title || "").trim(),
      sectionId: section.sectionId,
      title: section.title,
      url: section.url,
      editorialStatus: section.status,
      reviewStatus: bookSection.needsReview || references.some((reference) => reference.needsReview)
        ? "needs_review"
        : "approved",
      eligible: true,
      bookSource: {
        fileName: pdfFileName,
        corpusFile: "data/book-section-corpus.json",
        pdfChapterNumber: String(bookSection.pdfChapterNumber || "").trim(),
        pdfChapterTitle: String(bookSection.pdfChapterTitle || "").trim(),
        pageStart: Number(bookSection.pageStart || 0) || 0,
        pageEnd: Number(bookSection.pageEnd || 0) || 0,
        referenceCount: references.length,
        references
      },
      thematicReference: {
        indexFile: "data/book-topic-index.json",
        primaryTopic: String(topicSection.primaryTopic || "").trim(),
        transversalTopics: Array.isArray(topicSection.transversalTopics) ? topicSection.transversalTopics.map(String) : [],
        advancedSupportTopics: Array.isArray(topicSection.advancedSupportTopics) ? topicSection.advancedSupportTopics.map(String) : []
      }
    };
  });

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  description: "Manifesto de proveniência das seções autorizadas para exercícios IA do TERMO.",
  sources: {
    editorialRegistry: "data/termo-editorial-registry.json",
    bookCorpus: "data/book-section-corpus.json",
    topicIndex: "data/book-topic-index.json"
  },
  bookPdf: {
    fileName: pdfFileName,
    sourceField: "data/book-section-corpus.json#pdfSource",
    pageCount: Number(corpus.pageCount || 0) || 0,
    delivery: "protected"
  },
  eligibleSectionCount: sections.length,
  sections
};

await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Manifesto de fontes criado: ${sections.length} seções elegíveis.`);
