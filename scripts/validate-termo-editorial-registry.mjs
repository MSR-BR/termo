import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile, readdir } from "node:fs/promises";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const errors = [];

const readJson = async (relativePath) => JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
const policy = await readJson("data/termo-editorial-policy.json");
const registry = await readJson("data/termo-editorial-registry.json");
const searchIndex = await readJson("data/termo-published-search-index.json");
const indexHtml = await readFile(path.join(rootDir, "index.html"), "utf8");
const sitemapXml = await readFile(path.join(rootDir, "sitemap.xml"), "utf8");
const exerciseHandler = await readFile(path.join(rootDir, "lib", "exercicio-handler.mjs"), "utf8");
const exerciseClient = await readFile(path.join(rootDir, "assets", "ai-exercises.js"), "utf8");
const exerciseIndexBuilder = await readFile(path.join(rootDir, "scripts", "build-ai-exercise-index-page.mjs"), "utf8");
const quizGenerator = await readFile(path.join(rootDir, "lib", "gamification-ai-quiz.mjs"), "utf8");

function fail(message) {
  errors.push(message);
}

function sameBoolean(actual, expected, label) {
  if (actual !== expected) fail(`${label}: esperado ${expected}, recebido ${actual}.`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const chapterFiles = (await readdir(dataDir))
  .filter((name) => /^capitulo-\d+\.json$/.test(name))
  .sort();
const policyChapterIds = new Set();
const expectedSections = new Map();

for (const chapter of policy.chapters || []) {
  const chapterId = String(chapter.chapterId || "").padStart(2, "0");
  if (policyChapterIds.has(chapterId)) fail(`Capítulo duplicado na política: ${chapterId}.`);
  policyChapterIds.add(chapterId);
  if (!(policy.statusValues || []).includes(chapter.status)) fail(`Estado inválido no capítulo ${chapterId}.`);
  if (!chapter.publicAvailable && (chapter.searchEligible || chapter.seoEligible || chapter.aiExerciseEligible)) {
    fail(`Capítulo ${chapterId}: conteúdo não público não pode ser elegível.`);
  }
  if (chapter.status === "blocked" && !String(chapter.blockedReason || "").trim()) {
    fail(`Capítulo ${chapterId}: bloqueio sem motivo.`);
  }

  const source = await readJson(chapter.dataFile);
  for (const topic of source.topics || []) {
    const sectionId = String(topic.id || "").trim();
    const override = policy.sectionOverrides?.[sectionId] || {};
    const status = override.status || chapter.status;
    const publicAvailable = Boolean(chapter.publicAvailable && (override.publicAvailable ?? true));
    const searchEligible = Boolean(publicAvailable && chapter.searchEligible && (override.searchEligible ?? true));
    const seoEligible = Boolean(publicAvailable && chapter.seoEligible && (override.seoEligible ?? true));
    const aiExerciseEligible = Boolean(publicAvailable && chapter.aiExerciseEligible && topic.aiExercise === true && (override.aiExerciseEligible ?? true));
    expectedSections.set(sectionId, {
      chapterId,
      sectionId,
      title: topic.title,
      url: String(topic.url || "").replace(/^\/+/, ""),
      status,
      publicAvailable,
      searchEligible,
      seoEligible,
      aiExerciseEligible
    });
  }
}

for (const fileName of chapterFiles) {
  const chapterId = fileName.match(/capitulo-(\d+)\.json/)?.[1];
  if (!policyChapterIds.has(chapterId)) fail(`${fileName}: capítulo sem política editorial.`);
}

const registryChapterById = new Map((registry.chapters || []).map((chapter) => [chapter.chapterId, chapter]));
for (const chapter of policy.chapters || []) {
  const actual = registryChapterById.get(chapter.chapterId);
  if (!actual) {
    fail(`Capítulo ${chapter.chapterId} ausente do registry.`);
    continue;
  }
  for (const field of ["status", "publicAvailable", "searchEligible", "seoEligible", "aiExerciseEligible"]) {
    const expected = typeof chapter[field] === "boolean"
      ? Boolean(chapter.publicAvailable && chapter[field])
      : chapter[field];
    if (actual[field] !== expected) fail(`Capítulo ${chapter.chapterId}: campo ${field} divergente.`);
  }
}

const registrySectionById = new Map((registry.sections || []).map((section) => [section.sectionId, section]));
for (const [sectionId, expected] of expectedSections) {
  const actual = registrySectionById.get(sectionId);
  if (!actual) {
    fail(`Seção ${sectionId} ausente do registry.`);
    continue;
  }
  for (const field of ["chapterId", "title", "url", "status"]) {
    if (actual[field] !== expected[field]) fail(`Seção ${sectionId}: campo ${field} divergente.`);
  }
  for (const field of ["publicAvailable", "searchEligible", "seoEligible", "aiExerciseEligible"]) {
    sameBoolean(actual[field], expected[field], `Seção ${sectionId}, ${field}`);
  }
  try {
    await access(path.resolve(rootDir, actual.url));
  } catch {
    fail(`Seção ${sectionId}: URL física inexistente (${actual.url}).`);
  }
}
for (const sectionId of registrySectionById.keys()) {
  if (!expectedSections.has(sectionId)) fail(`Seção extra no registry: ${sectionId}.`);
}

const chapterMenuStart = indexHtml.indexOf("const chapters = [");
const chapterMenuEnd = indexHtml.indexOf("const embeddedChapterData", chapterMenuStart);
const chapterMenu = indexHtml.slice(chapterMenuStart, chapterMenuEnd);
for (const chapter of registry.chapters || []) {
  const entry = chapterMenu.match(new RegExp(`\\{[^{}]*id: "${chapter.chapterId}"[^{}]*\\}`))?.[0] || "";
  if (!entry) {
    fail(`Capítulo ${chapter.chapterId} ausente do menu do app.`);
    continue;
  }
  const disabled = /disabled:\s*true/.test(entry);
  sameBoolean(disabled, !chapter.publicAvailable, `Menu do capítulo ${chapter.chapterId}, disabled`);
}

const embeddedDataStart = indexHtml.indexOf("const embeddedChapterData = {");
const embeddedDataEnd = indexHtml.indexOf("const JSPDF_CDN_URL", embeddedDataStart);
const embeddedChapterData = indexHtml.slice(embeddedDataStart, embeddedDataEnd);
for (const section of registry.sections || []) {
  const entry = embeddedChapterData.match(new RegExp(`\\{[^\\n{}]*id: "${escapeRegExp(section.sectionId)}"[^\\n{}]*\\}`))?.[0] || "";
  if (!entry) {
    fail(`Seção ${section.sectionId} ausente dos dados embutidos do menu.`);
    continue;
  }
  const aiExercise = /aiExercise:\s*true/.test(entry);
  sameBoolean(aiExercise, section.aiExerciseEligible, `Dados embutidos da seção ${section.sectionId}, aiExercise`);
}

const expectedSearchIds = new Set(
  (registry.sections || []).filter((section) => section.publicAvailable && section.searchEligible).map((section) => section.sectionId)
);
const actualSearchIds = new Set((searchIndex.sections || []).map((section) => section.sectionId));
for (const sectionId of expectedSearchIds) if (!actualSearchIds.has(sectionId)) fail(`Busca: seção elegível ausente ${sectionId}.`);
for (const sectionId of actualSearchIds) if (!expectedSearchIds.has(sectionId)) fail(`Busca: seção não elegível presente ${sectionId}.`);

const sitemapLocations = new Set(Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]));
for (const section of registry.sections || []) {
  const absoluteUrl = `https://termo.app.br/${section.url}`;
  if (section.publicAvailable && section.seoEligible && !sitemapLocations.has(absoluteUrl)) {
    fail(`Sitemap: seção SEO elegível ausente ${section.sectionId}.`);
  }
  if ((!section.publicAvailable || !section.seoEligible) && sitemapLocations.has(absoluteUrl)) {
    fail(`Sitemap: seção não elegível presente ${section.sectionId}.`);
  }
}
for (const url of sitemapLocations) {
  const match = url.match(/\/slides\/capitulo-(\d+)\//);
  if (!match) continue;
  const chapter = registryChapterById.get(match[1]);
  if (!chapter?.publicAvailable || !chapter?.seoEligible) fail(`Sitemap contém capítulo bloqueado: ${url}.`);
}

if (!exerciseHandler.includes("isAiExerciseEligible")) fail("API de exercícios não aplica o registry editorial.");
if (!exerciseClient.includes("termo-editorial-registry.json")) fail("Cliente de exercícios não consulta o registry editorial.");
if (!exerciseIndexBuilder.includes("ai-exercise-source-manifest.json")) {
  fail("Catálogo de exercícios não deriva do manifesto vinculado à elegibilidade editorial.");
}
if (!quizGenerator.includes("getEditorialRegistry")) fail("Catálogo de simulados IA não consulta o registry editorial.");

const chapterFive = registryChapterById.get("05");
if (!chapterFive || chapterFive.status !== "blocked" || chapterFive.publicAvailable || chapterFive.searchEligible || chapterFive.seoEligible || chapterFive.aiExerciseEligible) {
  fail("Capítulo 5 não está bloqueado de modo consistente.");
}

if (errors.length) {
  console.error("Validação do registry editorial falhou:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const aiCount = (registry.sections || []).filter((section) => section.aiExerciseEligible).length;
console.log(`Registry editorial válido: ${registry.chapters.length} capítulos, ${registry.sections.length} seções, ${expectedSearchIds.size} públicas e ${aiCount} elegíveis para exercício IA.`);
