import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const destination = path.join(rootDir, "data", "termo-published-search-index.json");
const taxonomyPath = path.join(rootDir, "data", "book-topic-taxonomy.json");
const registryPath = path.join(rootDir, "data", "termo-editorial-registry.json");

function unique(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const chapterById = new Map((registry.chapters || []).map((chapter) => [chapter.chapterId, chapter]));
const searchableSectionIds = new Set(
  (registry.sections || [])
    .filter((section) => section.publicAvailable && section.searchEligible)
    .map((section) => section.sectionId)
);
const topicLabels = new Map(
  (taxonomy.transversalTopics || []).map((topic) => [String(topic.id || ""), String(topic.label || "").trim()])
);
const taxonomyBySection = new Map(
  (taxonomy.sectionTopics || []).map((section) => [String(section.sectionId || ""), section])
);
const sections = [];

for (const chapterMeta of (registry.chapters || []).filter((chapter) => chapter.publicAvailable && chapter.searchEligible)) {
  const sourcePath = path.join(rootDir, chapterMeta.dataFile);
  const chapter = JSON.parse(await readFile(sourcePath, "utf8"));

  for (const topic of Array.isArray(chapter.topics) ? chapter.topics : []) {
    const sectionId = String(topic.id || "").trim();
    if (!searchableSectionIds.has(sectionId)) continue;
    const title = String(topic.title || "").trim();
    const url = String(topic.url || "").replace(/^\/+/, "").trim();
    if (!sectionId || !title || !url) continue;

    const targetPath = path.resolve(rootDir, url);
    if (!targetPath.startsWith(`${rootDir}${path.sep}`)) {
      throw new Error(`URL fora do projeto na seção ${sectionId}: ${url}`);
    }
    await access(targetPath);

    const taxonomyEntry = taxonomyBySection.get(sectionId);
    const keywordIds = unique([
      ...(taxonomyEntry?.topicTags || []),
      ...(taxonomyEntry?.advancedTopicTags || [])
    ].map(String));
    const keywords = unique(keywordIds.map((id) => topicLabels.get(id)).filter(Boolean));

    sections.push({
      chapterId: chapterMeta.chapterId,
      chapterTitle: chapterMeta.title,
      chapterDescription: String(chapter.description || "").trim(),
      sectionId,
      title,
      summary: String(topic.note || `Conteúdo da seção ${sectionId}.`).trim(),
      url,
      keywords
    });
  }
}

const unexpectedSections = sections.filter((section) => !searchableSectionIds.has(section.sectionId));
if (unexpectedSections.length || sections.length !== searchableSectionIds.size) {
  throw new Error("O índice público diverge do registry editorial.");
}

await writeFile(
  destination,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), source: "data/capitulo-*.json + data/termo-editorial-registry.json", publishedChapterIds: Array.from(chapterById.values()).filter((chapter) => chapter.publicAvailable && chapter.searchEligible).map((chapter) => chapter.chapterId), sections }, null, 2)}\n`,
  "utf8"
);

console.log(`Índice público do TERMO criado: ${sections.length} seções em ${path.relative(rootDir, destination)}.`);
