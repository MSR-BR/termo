import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const taxonomyPath = path.join(rootDir, "data", "book-topic-taxonomy.json");
const corpusPath = path.join(rootDir, "data", "book-section-corpus.json");
const outputPath = path.join(rootDir, "data", "book-topic-index.json");

function truncateText(value = "", maxChars = 900) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf("\n\n"), sliced.lastIndexOf(". "));
  if (lastBreak >= Math.floor(maxChars * 0.55)) {
    return `${sliced.slice(0, lastBreak + 1).trim()}...`;
  }

  return `${sliced.trimEnd()}...`;
}

function referenceSummary(section = {}) {
  return (section.references || []).map((reference) => ({
    id: reference.id,
    label: reference.label,
    pdfChapterNumber: reference.pdfChapterNumber,
    pdfChapterTitle: reference.pdfChapterTitle,
    pageStart: reference.pageStart,
    pageEnd: reference.pageEnd,
    mappingReason: reference.mappingReason,
    extractionSources: reference.extractionSources || [],
    needsReview: Boolean(reference.needsReview)
  }));
}

function buildFragment({ topicId, sectionEntry, section }) {
  const isPrimaryTopic = sectionEntry.primaryTopic === topicId;
  return {
    sectionId: sectionEntry.sectionId,
    chapterId: sectionEntry.chapterId,
    itemId: sectionEntry.itemId,
    title: sectionEntry.title,
    pagePath: section?.pagePath || "",
    relation: isPrimaryTopic ? "primary-topic" : "tagged-topic",
    primaryTopic: sectionEntry.primaryTopic,
    topicTags: sectionEntry.topicTags,
    pdfChapterNumber: section?.pdfChapterNumber || "",
    pdfChapterTitle: section?.pdfChapterTitle || "",
    pageStart: section?.pageStart || 0,
    pageEnd: section?.pageEnd || 0,
    references: referenceSummary(section),
    excerpt: truncateText(section?.excerpt || section?.content || "", 900),
    mappingReason: section?.mappingReason || ""
  };
}

function main() {
  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
  const sectionById = new Map((corpus.sections || []).map((section) => [section.itemId, section]));
  const taxonomySectionById = new Map(taxonomy.sectionTopics.map((entry) => [entry.sectionId, entry]));
  const topicConfigById = new Map(taxonomy.transversalTopics.map((topic) => [topic.id, topic]));

  const topics = taxonomy.transversalTopics.map((topic) => {
    const fragments = topic.sections.map((sectionId) => {
      const sectionEntry = taxonomySectionById.get(sectionId);
      return buildFragment({
        topicId: topic.id,
        sectionEntry,
        section: sectionById.get(sectionId)
      });
    });

    return {
      id: topic.id,
      label: topic.label,
      usage: topic.usage || "default",
      sectionCount: fragments.length,
      chapters: Array.from(new Set(fragments.map((fragment) => fragment.chapterId))).sort(),
      fragments,
      usageHint: "Use these fragments as complementary context. The AI-01 section reference remains the canonical anchor for a specific app page."
    };
  });

  const topicIdsBySection = new Map();
  for (const topic of topics) {
    for (const fragment of topic.fragments) {
      if (!topicIdsBySection.has(fragment.sectionId)) {
        topicIdsBySection.set(fragment.sectionId, []);
      }
      topicIdsBySection.get(fragment.sectionId).push(topic.id);
    }
  }

  const sectionIndex = taxonomy.sectionTopics.map((entry) => {
    const section = sectionById.get(entry.sectionId);
    const orderedCandidateTopics = [entry.primaryTopic, ...(entry.topicTags || [])]
      .filter((topicId, index, list) => topicIdsBySection.has(entry.sectionId) && list.indexOf(topicId) === index)
      .filter((topicId) => topicIdsBySection.get(entry.sectionId).includes(topicId));
    const orderedTransversalTopics = orderedCandidateTopics
      .filter((topicId) => (topicConfigById.get(topicId)?.usage || "default") !== "advanced-support");
    const advancedSupportTopics = [...(entry.advancedTopicTags || []), ...orderedCandidateTopics]
      .filter((topicId, index, list) => list.indexOf(topicId) === index)
      .filter((topicId) => topicIdsBySection.has(entry.sectionId) || topicConfigById.has(topicId))
      .filter((topicId) => (topicConfigById.get(topicId)?.usage || "default") === "advanced-support");

    return {
      sectionId: entry.sectionId,
      chapterId: entry.chapterId,
      itemId: entry.itemId,
      title: entry.title,
      pagePath: section?.pagePath || "",
      primaryTopic: entry.primaryTopic,
      topicTags: entry.topicTags,
      advancedTopicTags: entry.advancedTopicTags || [],
      transversalTopics: orderedTransversalTopics,
      advancedSupportTopics,
      canonicalReference: {
        pdfChapterNumber: section?.pdfChapterNumber || "",
        pdfChapterTitle: section?.pdfChapterTitle || "",
        pageStart: section?.pageStart || 0,
        pageEnd: section?.pageEnd || 0,
        references: referenceSummary(section)
      }
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    sourceTaxonomy: "data/book-topic-taxonomy.json",
    sourceCorpus: "data/book-section-corpus.json",
    description: "Multi-fragment topic index for TERMO AI exercises. It connects every app section to transversal topics and short canonical excerpts.",
    topicCount: topics.length,
    sectionCount: sectionIndex.length,
    topics,
    sectionIndex
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Book topic index written to ${path.relative(rootDir, outputPath)}`);
  console.log(`- ${topics.length} transversal topics`);
  console.log(`- ${sectionIndex.length} app sections`);
}

main();
