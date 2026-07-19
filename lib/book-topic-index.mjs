import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOPIC_INDEX_PATH = resolve(__dirname, "../data/book-topic-index.json");

let topicIndexCache = null;

export function hasBookTopicIndex() {
  return existsSync(TOPIC_INDEX_PATH);
}

export function loadBookTopicIndex() {
  if (!topicIndexCache) {
    topicIndexCache = existsSync(TOPIC_INDEX_PATH)
      ? JSON.parse(readFileSync(TOPIC_INDEX_PATH, "utf8"))
      : { topics: [], sectionIndex: [] };
  }

  return topicIndexCache;
}

export function getTopicIndexEntry(topicId) {
  const topicIndex = loadBookTopicIndex();
  return topicIndex.topics.find((topic) => topic.id === topicId) || null;
}

export function getSectionTopicIndex(sectionId) {
  const topicIndex = loadBookTopicIndex();
  return topicIndex.sectionIndex.find((section) => section.sectionId === sectionId) || null;
}

export function getRelatedTopicFragmentsForSection(sectionId, { maxFragments = 6 } = {}) {
  const section = getSectionTopicIndex(sectionId);
  if (!section) return [];

  const topicIndex = loadBookTopicIndex();
  const currentSectionId = String(sectionId);
  const fragments = [];

  for (const topicId of section.transversalTopics || []) {
    const topic = topicIndex.topics.find((entry) => entry.id === topicId);
    if (!topic) continue;

    for (const fragment of topic.fragments || []) {
      if (fragment.sectionId === currentSectionId) continue;
      fragments.push({
        topicId,
        topicLabel: topic.label,
        ...fragment
      });
    }
  }

  return fragments.slice(0, maxFragments);
}

export function getAdvancedSupportFragmentsForSection(sectionId, { maxFragments = 6 } = {}) {
  const section = getSectionTopicIndex(sectionId);
  if (!section) return [];

  const topicIndex = loadBookTopicIndex();
  const currentSectionId = String(sectionId);
  const fragments = [];

  for (const topicId of section.advancedSupportTopics || []) {
    const topic = topicIndex.topics.find((entry) => entry.id === topicId);
    if (!topic) continue;

    for (const fragment of topic.fragments || []) {
      if (fragment.sectionId === currentSectionId) continue;
      fragments.push({
        topicId,
        topicLabel: topic.label,
        ...fragment
      });
    }
  }

  return fragments.slice(0, maxFragments);
}
