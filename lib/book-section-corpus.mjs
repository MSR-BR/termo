import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = resolve(__dirname, "../data/book-section-corpus.json");

let corpusCache = null;
let indexedCache = null;

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(value = "", maxChars = 1200) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf("\n\n"), sliced.lastIndexOf(". "));
  if (lastBreak >= Math.floor(maxChars * 0.55)) {
    return `${sliced.slice(0, lastBreak + 1).trim()}...`;
  }

  return `${sliced.trimEnd()}...`;
}

function buildCorpusIndex(corpus) {
  const sections = Array.isArray(corpus?.sections) ? corpus.sections : [];
  const byTopic = new Map();
  const byPagePath = new Map();
  const byTitle = new Map();
  const pageReferences = Array.isArray(corpus?.pageReferences) ? corpus.pageReferences : [];

  sections.forEach(function (section) {
    const topicKey = `${String(section.chapterId || "").padStart(2, "0")}:${String(section.itemId || "")}`;
    if (section.chapterId && section.itemId) {
      byTopic.set(topicKey, section);
    }

    if (section.pagePath) {
      byPagePath.set(String(section.pagePath).trim(), section);
    }

    const normalizedTitle = normalizeText(section.topicTitle || section.sectionTitle || "");
    if (normalizedTitle && !byTitle.has(normalizedTitle)) {
      byTitle.set(normalizedTitle, section);
    }
  });

  return {
    raw: corpus,
    sections,
    pageReferences,
    byTopic,
    byPagePath,
    byTitle
  };
}

function ensureIndexedCorpus() {
  if (indexedCache) return indexedCache;

  if (!existsSync(CORPUS_PATH)) {
    indexedCache = buildCorpusIndex({ sections: [] });
    return indexedCache;
  }

  if (!corpusCache) {
    corpusCache = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  }

  indexedCache = buildCorpusIndex(corpusCache);
  return indexedCache;
}

export function hasBookSectionCorpus() {
  return ensureIndexedCorpus().sections.length > 0;
}

export function loadBookSectionCorpus() {
  return ensureIndexedCorpus().raw || { sections: [] };
}

function normalizeReference(reference = {}) {
  return {
    id: String(reference.id || "").trim(),
    label: String(reference.label || "").trim(),
    pdfChapterNumber: String(reference.pdfChapterNumber || "").trim(),
    pdfChapterTitle: String(reference.pdfChapterTitle || "").trim(),
    pageStart: Number(reference.pageStart || 0) || 0,
    pageEnd: Number(reference.pageEnd || 0) || 0,
    startMarker: String(reference.startMarker || "").trim(),
    endMarker: String(reference.endMarker || "").trim(),
    mappingReason: String(reference.mappingReason || "").trim(),
    extractionSources: Array.isArray(reference.extractionSources) ? reference.extractionSources.map(String) : [],
    needsReview: Boolean(reference.needsReview),
    content: String(reference.content || "").trim(),
    excerpt: String(reference.excerpt || truncateText(reference.content || "", 700)).trim()
  };
}

export function getBookSectionContext({
  chapterId = "",
  itemId = "",
  pagePath = "",
  pageTitle = ""
} = {}) {
  const corpus = ensureIndexedCorpus();
  const normalizedChapterId = String(chapterId || "").padStart(2, "0");
  const normalizedItemId = String(itemId || "").trim();
  const normalizedPagePath = String(pagePath || "").trim();

  let section = null;

  if (normalizedChapterId && normalizedItemId) {
    section = corpus.byTopic.get(`${normalizedChapterId}:${normalizedItemId}`) || null;
  }

  if (!section && normalizedPagePath) {
    section = corpus.byPagePath.get(normalizedPagePath) || null;
  }

  if (!section && pageTitle) {
    section = corpus.byTitle.get(normalizeText(pageTitle)) || null;
  }

  if (!section) return null;

  const content = String(section.content || "").trim();
  const excerpt = String(section.excerpt || truncateText(content, 1400)).trim();
  const references = Array.isArray(section.references)
    ? section.references.map(normalizeReference)
    : [];

  return {
    chapterId: String(section.chapterId || normalizedChapterId || "").padStart(2, "0"),
    itemId: String(section.itemId || normalizedItemId || "").trim(),
    topicTitle: String(section.topicTitle || pageTitle || "").trim(),
    pagePath: String(section.pagePath || normalizedPagePath || "").trim(),
    pdfChapterNumber: String(section.pdfChapterNumber || "").trim(),
    pdfChapterTitle: String(section.pdfChapterTitle || "").trim(),
    pageStart: Number(section.pageStart || 0) || 0,
    pageEnd: Number(section.pageEnd || 0) || 0,
    matchScore: Number(section.matchScore || 0) || 0,
    mappingReason: String(section.mappingReason || "").trim(),
    extractionSources: Array.from(new Set(references.flatMap((reference) => reference.extractionSources || []))),
    referenceCount: Number(section.referenceCount || references.length || 0) || 0,
    needsReview: Boolean(section.needsReview || references.some((reference) => reference.needsReview)),
    references,
    content,
    excerpt
  };
}

export function buildChapterBookContext(
  chapter,
  {
    maxCharsPerTopic = 700,
    maxTopics = 12
  } = {}
) {
  const topics = Array.isArray(chapter?.topics) ? chapter.topics.slice(0, maxTopics) : [];
  if (!topics.length) return "";

  return topics.map(function (topic, index) {
    const section = getBookSectionContext({
      chapterId: chapter.id,
      itemId: topic.id,
      pagePath: topic.url,
      pageTitle: topic.title
    });

    const excerpt = truncateText(
      section?.content || section?.excerpt || topic.note || "",
      maxCharsPerTopic
    );

    return [
      `${index + 1}. item ${topic.id || ""}`,
      `titulo: ${topic.title || ""}`,
      section?.pageStart ? `paginas_pdf: ${section.pageStart}${section.pageEnd && section.pageEnd !== section.pageStart ? `-${section.pageEnd}` : ""}` : "",
      section?.referenceCount > 1 ? `referencias_pdf: ${section.references.map((reference) => `${reference.label || reference.id} p.${reference.pageStart}-${reference.pageEnd}`).join("; ")}` : "",
      excerpt ? `trecho_canonico: ${excerpt}` : "",
      topic.note ? `resumo_app: ${topic.note}` : "",
      topic.url ? `url: ${topic.url}` : ""
    ].filter(Boolean).join(" | ");
  }).join("\n\n");
}
