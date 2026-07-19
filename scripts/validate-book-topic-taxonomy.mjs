import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const taxonomyPath = path.join(rootDir, "data", "book-topic-taxonomy.json");
const corpusPath = path.join(rootDir, "data", "book-section-corpus.json");

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

const corpusSectionIds = new Set(corpus.sections.map((item) => item.itemId));
const taxonomySectionIds = new Set(taxonomy.sectionTopics.map((entry) => entry.sectionId));
const transversalTopicIds = new Set(taxonomy.transversalTopics.map((topic) => topic.id));
const errors = [];

for (const sectionId of corpusSectionIds) {
  if (!taxonomySectionIds.has(sectionId)) {
    errors.push(`Missing taxonomy entry for corpus section ${sectionId}`);
  }
}

for (const entry of taxonomy.sectionTopics) {
  if (!corpusSectionIds.has(entry.sectionId)) {
    errors.push(`Taxonomy entry ${entry.sectionId} does not exist in corpus`);
  }

  if (!entry.primaryTopic) {
    errors.push(`Taxonomy entry ${entry.sectionId} has no primaryTopic`);
  }

  if (!Array.isArray(entry.topicTags) || entry.topicTags.length === 0) {
    errors.push(`Taxonomy entry ${entry.sectionId} has no topicTags`);
  }

  for (const tag of entry.topicTags || []) {
    if (!transversalTopicIds.has(tag) && tag !== entry.primaryTopic) {
      errors.push(`Taxonomy entry ${entry.sectionId} references unknown topic tag ${tag}`);
    }
  }

  for (const tag of entry.advancedTopicTags || []) {
    if (!transversalTopicIds.has(tag)) {
      errors.push(`Taxonomy entry ${entry.sectionId} references unknown advanced topic tag ${tag}`);
    }
  }
}

for (const topic of taxonomy.transversalTopics) {
  if (!Array.isArray(topic.sections) || topic.sections.length === 0) {
    errors.push(`Transversal topic ${topic.id} has no sections`);
  }

  for (const sectionId of topic.sections || []) {
    if (!taxonomySectionIds.has(sectionId)) {
      errors.push(`Transversal topic ${topic.id} references unknown section ${sectionId}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Book topic taxonomy validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Book topic taxonomy valid.");
console.log(`- ${taxonomy.sectionTopics.length} app sections indexed.`);
console.log(`- ${taxonomy.transversalTopics.length} transversal topics indexed.`);
