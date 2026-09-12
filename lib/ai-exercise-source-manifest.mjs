import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../data/ai-exercise-source-manifest.json", import.meta.url), "utf8")
);

const sectionByKey = new Map(
  (manifest.sections || []).map((section) => [
    `${String(section.chapterId || "").padStart(2, "0")}:${String(section.sectionId || "")}`,
    section
  ])
);

function normalizeChapterId(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? digits.padStart(2, "0").slice(-2) : "";
}

function normalizeSectionId(chapterId = "", itemId = "") {
  const rawItem = String(itemId || "").trim();
  return rawItem.includes(".") ? rawItem : `${Number(chapterId)}.${rawItem}`;
}

export function getAiExerciseSourceManifestEntry({ chapterId = "", itemId = "" } = {}) {
  const normalizedChapterId = normalizeChapterId(chapterId);
  const sectionId = normalizeSectionId(normalizedChapterId, itemId);
  return sectionByKey.get(`${normalizedChapterId}:${sectionId}`) || null;
}

export function isAiExerciseSourceReady(input = {}) {
  const entry = getAiExerciseSourceManifestEntry(input);
  const references = entry?.bookSource?.references;
  return Boolean(
    entry?.eligible === true &&
    entry.reviewStatus === "approved" &&
    entry.bookSource?.fileName &&
    Array.isArray(references) &&
    references.length > 0 &&
    entry.bookSource?.referenceCount === references.length &&
    entry.bookSource?.pageStart > 0 &&
    entry.bookSource?.pageEnd >= entry.bookSource?.pageStart &&
    references.every((reference) =>
      reference.needsReview === false &&
      reference.pageStart > 0 &&
      reference.pageEnd >= reference.pageStart &&
      Array.isArray(reference.extractionSources) &&
      reference.extractionSources.length > 0
    ) &&
    entry.thematicReference?.primaryTopic
  );
}

export function getAiExerciseSourceManifest() {
  return manifest;
}
