import topicTaxonomy from "../data/book-topic-taxonomy.json" with { type: "json" };

export function getBookTopicTaxonomy() {
  return topicTaxonomy;
}

export function getTopicEntryForSection(sectionId) {
  return topicTaxonomy.sectionTopics.find((entry) => entry.sectionId === sectionId) || null;
}

export function getTransversalTopic(topicId) {
  return topicTaxonomy.transversalTopics.find((topic) => topic.id === topicId) || null;
}

export function getRelatedSectionsForTopic(topicId) {
  const topic = getTransversalTopic(topicId);
  if (!topic) {
    return [];
  }

  return topic.sections
    .map((sectionId) => getTopicEntryForSection(sectionId))
    .filter(Boolean);
}
