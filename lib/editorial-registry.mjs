import { readFileSync } from "node:fs";

const registry = JSON.parse(
  readFileSync(new URL("../data/termo-editorial-registry.json", import.meta.url), "utf8")
);

const sectionByKey = new Map(
  (registry.sections || []).map((section) => [
    `${String(section.chapterId || "").padStart(2, "0")}:${String(section.sectionId || "")}`,
    section
  ])
);

export function getEditorialSection({ chapterId = "", itemId = "" } = {}) {
  const normalizedChapter = String(chapterId || "").replace(/\D/g, "").padStart(2, "0").slice(-2);
  const rawItem = String(itemId || "").trim();
  const sectionId = rawItem.includes(".") ? rawItem : `${Number(normalizedChapter)}.${rawItem}`;
  return sectionByKey.get(`${normalizedChapter}:${sectionId}`) || null;
}

export function isAiExerciseEligible(input = {}) {
  return getEditorialSection(input)?.aiExerciseEligible === true;
}

export function getEditorialRegistry() {
  return registry;
}
