import path from "node:path";
import { access } from "node:fs/promises";

function normalizeChapterId(value = "") {
  return String(value || "").padStart(2, "0");
}

function sameStringList(left = [], right = []) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function validateAiExerciseSourceManifest({
  rootDir,
  manifest,
  registry,
  corpus,
  topicIndex,
  pathExists = async (filePath) => {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}) {
  const errors = [];
  const expectedSections = (registry.sections || []).filter(
    (section) => section.publicAvailable && section.aiExerciseEligible
  );
  const expectedById = new Map(expectedSections.map((section) => [section.sectionId, section]));
  const chapterById = new Map((registry.chapters || []).map((chapter) => [chapter.chapterId, chapter]));
  const corpusById = new Map((corpus.sections || []).map((section) => [section.itemId, section]));
  const topicById = new Map((topicIndex.sectionIndex || []).map((section) => [section.sectionId, section]));
  const actualById = new Map();
  const pdfFileName = path.basename(String(corpus.pdfSource || ""));
  const canonicalSources = {
    editorialRegistry: "data/termo-editorial-registry.json",
    bookCorpus: "data/book-section-corpus.json",
    topicIndex: "data/book-topic-index.json"
  };

  for (const [sourceName, relativePath] of Object.entries(canonicalSources)) {
    if (manifest.sources?.[sourceName] !== relativePath) {
      errors.push(`Fonte canônica divergente no manifesto: ${sourceName}.`);
    }
    if (!(await pathExists(path.join(rootDir, relativePath)))) {
      errors.push(`Fonte canônica inexistente: ${relativePath}.`);
    }
  }

  if (!String(corpus.pdfSource || "").toLowerCase().endsWith(".pdf")) {
    errors.push("Corpus sem fonte PDF identificável.");
  }
  if (!manifest.bookPdf?.fileName || manifest.bookPdf.fileName !== pdfFileName) {
    errors.push("Fonte PDF do manifesto diverge do corpus.");
  }
  if (manifest.bookPdf?.sourceField !== "data/book-section-corpus.json#pdfSource") {
    errors.push("Manifesto sem vínculo explícito ao campo canônico da fonte PDF.");
  }
  if (Number(manifest.eligibleSectionCount) !== expectedSections.length) {
    errors.push(`Contagem elegível divergente: esperado ${expectedSections.length}.`);
  }

  for (const entry of manifest.sections || []) {
    if (actualById.has(entry.sectionId)) {
      errors.push(`Seção duplicada no manifesto: ${entry.sectionId}.`);
      continue;
    }
    actualById.set(entry.sectionId, entry);

    const editorial = expectedById.get(entry.sectionId);
    const chapter = chapterById.get(normalizeChapterId(entry.chapterId));
    const bookSection = corpusById.get(entry.sectionId);
    const topicSection = topicById.get(entry.sectionId);

    if (!editorial) errors.push(`Seção não elegível presente no manifesto: ${entry.sectionId}.`);
    if (!chapter || chapter.status === "blocked" || !chapter.publicAvailable || !chapter.aiExerciseEligible) {
      errors.push(`Seção de capítulo bloqueado ou inelegível no manifesto: ${entry.sectionId}.`);
    }
    if (entry.eligible !== true) errors.push(`Seção ${entry.sectionId}: elegibilidade deve ser verdadeira.`);
    if (entry.reviewStatus !== "approved") errors.push(`Seção ${entry.sectionId}: fonte marcada para revisão.`);
    if (!entry.url) {
      errors.push(`Seção ${entry.sectionId}: URL da página ausente.`);
    } else {
      const absolutePage = path.resolve(rootDir, String(entry.url).replace(/^\/+/, ""));
      const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;
      if (!absolutePage.startsWith(rootPrefix) || !(await pathExists(absolutePage))) {
        errors.push(`Seção ${entry.sectionId}: página HTML inexistente (${entry.url}).`);
      }
    }
    if (editorial) {
      for (const field of ["chapterId", "sectionId", "title", "url"]) {
        if (entry[field] !== editorial[field]) errors.push(`Seção ${entry.sectionId}: campo ${field} diverge do registry.`);
      }
    }
    if (chapter && entry.chapterTitle !== chapter.title) {
      errors.push(`Seção ${entry.sectionId}: título do capítulo diverge do registry.`);
    }
    if (editorial && entry.editorialStatus !== editorial.status) {
      errors.push(`Seção ${entry.sectionId}: estado editorial diverge do registry.`);
    }

    if (!bookSection) {
      errors.push(`Seção ${entry.sectionId}: referência ao livro ausente no corpus.`);
    } else {
      if (bookSection.needsReview) errors.push(`Seção ${entry.sectionId}: corpus marcado para revisão.`);
      if (bookSection.pagePath !== entry.url) errors.push(`Seção ${entry.sectionId}: URL diverge do corpus.`);
      if (!Array.isArray(bookSection.references) || !bookSection.references.length) {
        errors.push(`Seção ${entry.sectionId}: corpus sem referência ao livro.`);
      }
    }

    const bookSource = entry.bookSource || {};
    if (!bookSource.fileName || bookSource.fileName !== pdfFileName) {
      errors.push(`Seção ${entry.sectionId}: arquivo-fonte PDF ausente ou divergente.`);
    }
    if (bookSource.corpusFile !== "data/book-section-corpus.json") {
      errors.push(`Seção ${entry.sectionId}: arquivo de corpus canônico ausente.`);
    }
    if (!bookSource.pdfChapterNumber || !bookSource.pdfChapterTitle) {
      errors.push(`Seção ${entry.sectionId}: capítulo do PDF não identificado.`);
    }
    if (!(bookSource.pageStart > 0) || !(bookSource.pageEnd >= bookSource.pageStart)) {
      errors.push(`Seção ${entry.sectionId}: intervalo de páginas do PDF inválido.`);
    }
    if (!Array.isArray(bookSource.references) || !bookSource.references.length) {
      errors.push(`Seção ${entry.sectionId}: referências canônicas ausentes.`);
    } else {
      if (bookSource.referenceCount !== bookSource.references.length) {
        errors.push(`Seção ${entry.sectionId}: contagem de referências divergente.`);
      }
      for (const reference of bookSource.references) {
        if (!reference.id || !(reference.pageStart > 0) || !(reference.pageEnd >= reference.pageStart)) {
          errors.push(`Seção ${entry.sectionId}: referência PDF incompleta.`);
        }
        if (!Array.isArray(reference.extractionSources) || !reference.extractionSources.length) {
          errors.push(`Seção ${entry.sectionId}: origem de extração da referência ausente.`);
        }
        if (reference.needsReview) errors.push(`Seção ${entry.sectionId}: referência marcada para revisão.`);
      }
    }
    if (bookSection) {
      for (const field of ["pdfChapterNumber", "pdfChapterTitle", "pageStart", "pageEnd"]) {
        if (bookSource[field] !== bookSection[field]) {
          errors.push(`Seção ${entry.sectionId}: ${field} diverge do corpus.`);
        }
      }
      const canonicalReferences = (bookSection.references || []).map((reference) => ({
        id: String(reference.id || "").trim(),
        label: String(reference.label || "").trim(),
        pdfChapterNumber: String(reference.pdfChapterNumber || "").trim(),
        pdfChapterTitle: String(reference.pdfChapterTitle || "").trim(),
        pageStart: Number(reference.pageStart || 0) || 0,
        pageEnd: Number(reference.pageEnd || 0) || 0,
        extractionSources: Array.isArray(reference.extractionSources) ? reference.extractionSources.map(String) : [],
        needsReview: Boolean(reference.needsReview)
      }));
      if (JSON.stringify(bookSource.references || []) !== JSON.stringify(canonicalReferences)) {
        errors.push(`Seção ${entry.sectionId}: referências divergem do corpus.`);
      }
    }

    const thematic = entry.thematicReference || {};
    if (!topicSection || !thematic.primaryTopic) {
      errors.push(`Seção ${entry.sectionId}: referência temática ausente.`);
    } else {
      if (thematic.primaryTopic !== topicSection.primaryTopic) {
        errors.push(`Seção ${entry.sectionId}: tópico principal divergente.`);
      }
      if (!sameStringList(thematic.transversalTopics, topicSection.transversalTopics)) {
        errors.push(`Seção ${entry.sectionId}: tópicos transversais divergentes.`);
      }
      if (!sameStringList(thematic.advancedSupportTopics, topicSection.advancedSupportTopics)) {
        errors.push(`Seção ${entry.sectionId}: tópicos avançados divergentes.`);
      }
    }
  }

  for (const section of expectedSections) {
    if (!actualById.has(section.sectionId)) errors.push(`Seção elegível ausente do manifesto: ${section.sectionId}.`);
  }

  return errors;
}
