import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const indexPath = path.join(rootDir, "data", "book-topic-index.json");
const taxonomyPath = path.join(rootDir, "data", "book-topic-taxonomy.json");

const topicIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

const errors = [];
const taxonomySectionIds = new Set(taxonomy.sectionTopics.map((entry) => entry.sectionId));
const indexSectionIds = new Set((topicIndex.sectionIndex || []).map((entry) => entry.sectionId));
const indexTopicIds = new Set((topicIndex.topics || []).map((topic) => topic.id));

if (topicIndex.sectionCount !== taxonomy.sectionTopics.length) {
  errors.push(`sectionCount ${topicIndex.sectionCount} does not match taxonomy ${taxonomy.sectionTopics.length}`);
}

if (topicIndex.topicCount !== taxonomy.transversalTopics.length) {
  errors.push(`topicCount ${topicIndex.topicCount} does not match taxonomy ${taxonomy.transversalTopics.length}`);
}

for (const sectionId of taxonomySectionIds) {
  if (!indexSectionIds.has(sectionId)) {
    errors.push(`Missing index section ${sectionId}`);
  }
}

for (const topic of taxonomy.transversalTopics) {
  if (!indexTopicIds.has(topic.id)) {
    errors.push(`Missing index topic ${topic.id}`);
  }
}

for (const topic of topicIndex.topics || []) {
  if (!Array.isArray(topic.fragments) || topic.fragments.length === 0) {
    errors.push(`Topic ${topic.id} has no fragments`);
  }

  for (const fragment of topic.fragments || []) {
    if (!taxonomySectionIds.has(fragment.sectionId)) {
      errors.push(`Topic ${topic.id} references unknown section ${fragment.sectionId}`);
    }
    if (!fragment.excerpt) {
      errors.push(`Topic ${topic.id} fragment ${fragment.sectionId} has no excerpt`);
    }
  }
}

for (const section of topicIndex.sectionIndex || []) {
  if (!Array.isArray(section.transversalTopics)) {
    errors.push(`Section ${section.sectionId} has invalid transversalTopics`);
  }
  if (!Array.isArray(section.advancedSupportTopics)) {
    errors.push(`Section ${section.sectionId} has invalid advancedSupportTopics`);
  }
  if (!section.transversalTopics.length && !section.advancedSupportTopics.length) {
    errors.push(`Section ${section.sectionId} has no topic links`);
  }
}

if (errors.length > 0) {
  console.error("Book topic index validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Book topic index valid.");
console.log(`- ${topicIndex.sectionCount} app sections indexed.`);
console.log(`- ${topicIndex.topicCount} transversal topics indexed.`);
