import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const destination = path.join(rootDir, "data", "termo-published-search-index.json");
const taxonomyPath = path.join(rootDir, "data", "book-topic-taxonomy.json");

const publishedChapters = [
  { id: "01", title: "Conceitos Fundamentais" },
  { id: "02", title: "Potenciais Termodinâmicos e Aplicações" },
  { id: "03", title: "Termodinâmica Estatística" },
  { id: "04", title: "Transições de Fase" },
  { id: "06", title: "Ciclos Termodinâmicos" }
];

function unique(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

const taxonomy = JSON.parse(await readFile(taxonomyPath, "utf8"));
const topicLabels = new Map(
  (taxonomy.transversalTopics || []).map((topic) => [String(topic.id || ""), String(topic.label || "").trim()])
);
const taxonomyBySection = new Map(
  (taxonomy.sectionTopics || []).map((section) => [String(section.sectionId || ""), section])
);
const sections = [];

for (const chapterMeta of publishedChapters) {
  const sourcePath = path.join(rootDir, "data", `capitulo-${chapterMeta.id}.json`);
  const chapter = JSON.parse(await readFile(sourcePath, "utf8"));

  for (const topic of Array.isArray(chapter.topics) ? chapter.topics : []) {
    const sectionId = String(topic.id || "").trim();
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
      chapterId: chapterMeta.id,
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

if (sections.some((section) => section.chapterId === "05" || section.url.includes("capitulo-05"))) {
  throw new Error("O índice público não pode conter o Capítulo 5.");
}

await writeFile(
  destination,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), source: "data/capitulo-*.json", publishedChapterIds: publishedChapters.map(({ id }) => id), sections }, null, 2)}\n`,
  "utf8"
);

console.log(`Índice público do TERMO criado: ${sections.length} seções em ${path.relative(rootDir, destination)}.`);
