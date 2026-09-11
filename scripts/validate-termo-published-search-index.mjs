import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const indexPath = path.join(rootDir, "data", "termo-published-search-index.json");
const data = JSON.parse(await readFile(indexPath, "utf8"));
const errors = [];
const requiredFields = ["chapterId", "chapterTitle", "sectionId", "title", "summary", "url"];

if (!Array.isArray(data.sections) || data.sections.length === 0) errors.push("O índice não possui seções.");

for (const section of data.sections || []) {
  for (const field of requiredFields) {
    if (!String(section[field] || "").trim()) errors.push(`${section.sectionId || "entrada"}: campo ${field} ausente.`);
  }
  if (section.chapterId === "05" || String(section.url || "").includes("capitulo-05")) {
    errors.push(`${section.sectionId}: conteúdo bloqueado do Capítulo 5.`);
  }
  try {
    await access(path.resolve(rootDir, section.url));
  } catch {
    errors.push(`${section.sectionId}: arquivo inexistente ${section.url}.`);
  }
}

if (errors.length) {
  console.error("Validação do índice público falhou:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Índice público válido: ${data.sections.length} seções; Capítulo 5 ausente; URLs existentes.`);
