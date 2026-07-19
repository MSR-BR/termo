import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const CORPUS_PATH = resolve(ROOT_DIR, "data/book-section-corpus.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  if (!existsSync(CORPUS_PATH)) {
    fail(`Corpus nao encontrado: ${CORPUS_PATH}`);
  }

  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const sections = Array.isArray(corpus.sections) ? corpus.sections : [];
  const pageReferences = Array.isArray(corpus.pageReferences) ? corpus.pageReferences : [];

  const issues = [];
  const byChapter = new Map();

  if (!sections.length) issues.push("Nenhuma secao encontrada em corpus.sections.");
  if (!pageReferences.length) issues.push("Nenhum mapa encontrado em corpus.pageReferences.");

  pageReferences.forEach(function (page) {
    const chapterId = String(page.chapterId || "").padStart(2, "0");
    if (!byChapter.has(chapterId)) {
      byChapter.set(chapterId, { total: 0, needsReview: 0, multiReference: 0, fallbackExtraction: 0 });
    }

    const summary = byChapter.get(chapterId);
    summary.total += 1;
    if (page.needsReview) summary.needsReview += 1;
    if (Number(page.referenceCount || 0) > 1) summary.multiReference += 1;
    if ((page.references || []).some((reference) => (reference.extractionSources || []).includes("pdfplumber-fallback"))) {
      summary.fallbackExtraction += 1;
    }

    if (!page.pagePath) issues.push(`${chapterId} ${page.itemId}: pagePath ausente.`);
    if (!Array.isArray(page.references) || !page.references.length) {
      issues.push(`${chapterId} ${page.itemId}: referencias ausentes.`);
      return;
    }

    page.references.forEach(function (reference) {
      if (!reference.id) issues.push(`${chapterId} ${page.itemId}: referencia sem id.`);
      if (!reference.pageStart || !reference.pageEnd) {
        issues.push(`${chapterId} ${page.itemId}: referencia ${reference.id || ""} sem paginas.`);
      }
      if (reference.pageStart && reference.pageEnd && reference.pageStart > reference.pageEnd) {
        issues.push(`${chapterId} ${page.itemId}: referencia ${reference.id || ""} com paginas invertidas.`);
      }
    });
  });

  const sectionKeys = new Set(sections.map(function (section) {
    return `${String(section.chapterId || "").padStart(2, "0")}:${String(section.itemId || "")}`;
  }));

  sections.forEach(function (section) {
    const chapterId = String(section.chapterId || "").padStart(2, "0");
    if (!String(section.content || "").trim()) {
      issues.push(`${chapterId} ${section.itemId}: conteudo textual vazio.`);
    }
  });

  pageReferences.forEach(function (page) {
    const key = `${String(page.chapterId || "").padStart(2, "0")}:${String(page.itemId || "")}`;
    if (!sectionKeys.has(key)) {
      issues.push(`${key}: pageReferences sem secao correspondente.`);
    }
  });

  console.log("Resumo do corpus do livro:");
  Array.from(byChapter.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(function ([chapterId, summary]) {
      console.log(`- Cap. ${chapterId}: ${summary.total} paginas, ${summary.needsReview} para revisar, ${summary.multiReference} com multiplas referencias, ${summary.fallbackExtraction} com extracao complementar.`);
    });

  const reviewPages = pageReferences.filter((page) => page.needsReview);
  if (reviewPages.length) {
    console.log("\nItens marcados para revisao:");
    reviewPages.forEach(function (page) {
      const refs = page.references
        .map((reference) => `p.${reference.pageStart}-${reference.pageEnd}`)
        .join(", ");
      console.log(`- ${page.chapterId} ${page.itemId}: ${page.topicTitle} (${refs})`);
    });
  }

  if (issues.length) {
    console.log("\nProblemas estruturais:");
    issues.forEach((issue) => console.log(`- ${issue}`));
    process.exit(1);
  }

  console.log("\nEstrutura do corpus valida.");
}

main();
