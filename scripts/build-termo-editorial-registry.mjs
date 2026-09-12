import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile, writeFile } from "node:fs/promises";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = path.join(rootDir, "data", "termo-editorial-policy.json");
const outputPath = path.join(rootDir, "data", "termo-editorial-registry.json");

const policy = JSON.parse(await readFile(policyPath, "utf8"));
const statusValues = new Set(policy.statusValues || []);
const overrides = policy.sectionOverrides || {};
const chapters = [];
const sections = [];

for (const chapterPolicy of policy.chapters || []) {
  const chapterId = String(chapterPolicy.chapterId || "").padStart(2, "0");
  if (!chapterId || !statusValues.has(chapterPolicy.status)) {
    throw new Error(`Política editorial inválida para o capítulo ${chapterId || "sem ID"}.`);
  }
  if (chapterPolicy.status === "blocked" && !String(chapterPolicy.blockedReason || "").trim()) {
    throw new Error(`Capítulo ${chapterId} bloqueado sem motivo editorial.`);
  }

  const sourcePath = path.resolve(rootDir, chapterPolicy.dataFile || "");
  if (!sourcePath.startsWith(`${rootDir}${path.sep}`)) {
    throw new Error(`Fonte fora do projeto para o capítulo ${chapterId}.`);
  }
  await access(sourcePath);
  const chapterData = JSON.parse(await readFile(sourcePath, "utf8"));

  const chapterEntry = {
    chapterId,
    title: String(chapterPolicy.title || `Capítulo ${Number(chapterId)}`).trim(),
    dataFile: path.relative(rootDir, sourcePath).split(path.sep).join("/"),
    status: chapterPolicy.status,
    publicAvailable: Boolean(chapterPolicy.publicAvailable),
    searchEligible: Boolean(chapterPolicy.publicAvailable && chapterPolicy.searchEligible),
    seoEligible: Boolean(chapterPolicy.publicAvailable && chapterPolicy.seoEligible),
    aiExerciseEligible: Boolean(chapterPolicy.publicAvailable && chapterPolicy.aiExerciseEligible),
    blockedReason: String(chapterPolicy.blockedReason || "").trim() || null,
    sectionCount: Array.isArray(chapterData.topics) ? chapterData.topics.length : 0
  };
  chapters.push(chapterEntry);

  for (const topic of chapterData.topics || []) {
    const sectionId = String(topic.id || "").trim();
    const override = overrides[sectionId] || {};
    const status = override.status || chapterEntry.status;
    if (!statusValues.has(status)) throw new Error(`Estado inválido para a seção ${sectionId}.`);

    const publicAvailable = Boolean(chapterEntry.publicAvailable && (override.publicAvailable ?? true));
    const searchEligible = Boolean(publicAvailable && chapterEntry.searchEligible && (override.searchEligible ?? true));
    const seoEligible = Boolean(publicAvailable && chapterEntry.seoEligible && (override.seoEligible ?? true));
    const aiExerciseEligible = Boolean(
      publicAvailable &&
      chapterEntry.aiExerciseEligible &&
      topic.aiExercise === true &&
      (override.aiExerciseEligible ?? true)
    );
    const blockedReason = String(override.blockedReason || chapterEntry.blockedReason || "").trim() || null;
    if ((status === "blocked" || !publicAvailable) && !blockedReason) {
      throw new Error(`Seção ${sectionId} indisponível sem motivo editorial.`);
    }

    sections.push({
      chapterId,
      sectionId,
      title: String(topic.title || "").trim(),
      url: String(topic.url || "").replace(/^\/+/, "").trim(),
      status,
      publicAvailable,
      searchEligible,
      seoEligible,
      aiExerciseEligible,
      blockedReason
    });
  }
}

await writeFile(outputPath, `${JSON.stringify({
  schemaVersion: policy.schemaVersion,
  generatedAt: new Date().toISOString(),
  policySource: "data/termo-editorial-policy.json",
  contentSource: "data/capitulo-*.json",
  chapters,
  sections
}, null, 2)}\n`, "utf8");

console.log(`Registry editorial criado: ${chapters.length} capítulos e ${sections.length} seções.`);
