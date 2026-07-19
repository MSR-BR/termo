import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { getBookSectionContext } from "./book-section-corpus.mjs";
import {
  getAdvancedSupportFragmentsForSection,
  getRelatedTopicFragmentsForSection,
  getSectionTopicIndex
} from "./book-topic-index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const MAX_BOOK_CHARS = 2600;
const MAX_TEACHING_CHARS = 1800;
const MAX_FALLBACK_CHARS = 900;
const MAX_RELATED_FRAGMENT_CHARS = 520;
const MAX_RELATED_FRAGMENTS = 4;
const MAX_ADVANCED_FRAGMENTS = 3;

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(value = "", maxChars = 1000) {
  const text = normalizeWhitespace(value);
  if (!text || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf("\n\n"), sliced.lastIndexOf(". "));
  if (lastBreak >= Math.floor(maxChars * 0.55)) {
    return `${sliced.slice(0, lastBreak + 1).trim()}...`;
  }

  return `${sliced.trimEnd()}...`;
}

function normalizeChapterId(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? digits.padStart(2, "0").slice(-2) : "";
}

function normalizeSectionId({ chapterId = "", itemId = "" } = {}) {
  const normalizedChapterId = normalizeChapterId(chapterId);
  const normalizedItemId = String(itemId || "").trim();
  return normalizedChapterId && normalizedItemId ? `${Number(normalizedChapterId)}.${normalizedItemId.split(".").pop()}` : normalizedItemId;
}

function normalizeRelativePagePath(pagePath = "") {
  const raw = String(pagePath || "").trim().split(/[?#]/)[0];
  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
  const relative = withoutOrigin.replace(/^\/+/, "");
  if (!relative || relative.includes("..") || relative.startsWith("api/")) return "";
  return relative;
}

function resolveSafeWorkspacePath(relativePath = "") {
  const normalized = normalizeRelativePagePath(relativePath);
  if (!normalized) return "";

  const absolute = resolve(ROOT_DIR, normalized);
  const rootWithSep = ROOT_DIR.endsWith(sep) ? ROOT_DIR : `${ROOT_DIR}${sep}`;
  if (absolute !== ROOT_DIR && !absolute.startsWith(rootWithSep)) return "";
  return absolute;
}

function htmlToText(html = "") {
  return normalizeWhitespace(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
  );
}

function readTeachingContentFromPage(pagePath = "") {
  const absolutePath = resolveSafeWorkspacePath(pagePath);
  if (!absolutePath || !existsSync(absolutePath)) return "";

  try {
    return htmlToText(readFileSync(absolutePath, "utf8"));
  } catch {
    return "";
  }
}

function normalizeFragment(fragment = {}, maxChars = MAX_RELATED_FRAGMENT_CHARS) {
  return {
    topicId: String(fragment.topicId || "").trim(),
    topicLabel: String(fragment.topicLabel || "").trim(),
    sectionId: String(fragment.sectionId || "").trim(),
    chapterId: normalizeChapterId(fragment.chapterId || ""),
    itemId: String(fragment.itemId || "").trim(),
    title: String(fragment.title || "").trim(),
    pagePath: String(fragment.pagePath || "").trim(),
    pageStart: Number(fragment.pageStart || 0) || 0,
    pageEnd: Number(fragment.pageEnd || 0) || 0,
    excerpt: truncateText(fragment.excerpt || "", maxChars)
  };
}

function estimateExtractionQuality(value = "", extractionSources = []) {
  const text = String(value || "");
  const hasFallbackSource = Array.isArray(extractionSources) && extractionSources.includes("pdfplumber-fallback");
  const noisyPatterns = [
    /\(cid:\d+\)/,
    /[ÆØŒ]/,
    /[a-zà-ÿ]{3,}[A-Z]{2,}[a-zà-ÿ]{2,}/,
    /\b(?:avn|evedescr|essıespr|alidadev|interetarpr)\b/i
  ];
  const noisy = noisyPatterns.some((pattern) => pattern.test(text));
  if (noisy) return "noisy";
  if (hasFallbackSource) return "fallback";
  return "clean";
}

function buildSourceReferences(contextPackage = {}) {
  const references = [];
  const primary = contextPackage.primarySource;

  if (primary) {
    references.push({
      type: "book_pdf",
      role: "primary",
      chapterId: primary.chapterId,
      itemId: primary.itemId,
      pageStart: primary.pageStart,
      pageEnd: primary.pageEnd,
      pdfChapterNumber: primary.pdfChapterNumber,
      pdfChapterTitle: primary.pdfChapterTitle,
      referenceCount: primary.referenceCount
    });
  }

  if (contextPackage.teachingSource?.path) {
    references.push({
      type: "app_html",
      role: "teaching",
      path: contextPackage.teachingSource.path
    });
  }

  for (const fragment of contextPackage.relatedFragments || []) {
    references.push({
      type: "book_topic_fragment",
      role: "related",
      topicId: fragment.topicId,
      sectionId: fragment.sectionId,
      chapterId: fragment.chapterId,
      itemId: fragment.itemId,
      pageStart: fragment.pageStart,
      pageEnd: fragment.pageEnd
    });
  }

  for (const fragment of contextPackage.advancedSupportFragments || []) {
    references.push({
      type: "book_topic_fragment",
      role: "advanced_support",
      topicId: fragment.topicId,
      sectionId: fragment.sectionId,
      chapterId: fragment.chapterId,
      itemId: fragment.itemId,
      pageStart: fragment.pageStart,
      pageEnd: fragment.pageEnd
    });
  }

  if (contextPackage.fallbackSource?.available) {
    references.push({
      type: contextPackage.fallbackSource.type,
      role: "fallback",
      available: true
    });
  }

  return references;
}

export function buildAiExerciseContextPackage({
  chapterId = "",
  itemId = "",
  pagePath = "",
  pageTitle = "",
  pageSubtitle = "",
  pageContent = "",
  difficulty = "medio"
} = {}) {
  const normalizedChapterId = normalizeChapterId(chapterId);
  const normalizedItemId = String(itemId || "").trim();
  const sectionId = normalizeSectionId({ chapterId: normalizedChapterId, itemId: normalizedItemId });
  const relativePagePath = normalizeRelativePagePath(pagePath);
  const bookSection = getBookSectionContext({
    chapterId: normalizedChapterId,
    itemId: normalizedItemId,
    pagePath: relativePagePath,
    pageTitle
  });
  const topicIndexEntry = sectionId ? getSectionTopicIndex(sectionId) : null;
  const relatedFragments = sectionId
    ? getRelatedTopicFragmentsForSection(sectionId, { maxFragments: MAX_RELATED_FRAGMENTS }).map(normalizeFragment)
    : [];
  const advancedSupportFragments = difficulty === "dificil" && sectionId
    ? getAdvancedSupportFragmentsForSection(sectionId, { maxFragments: MAX_ADVANCED_FRAGMENTS }).map(normalizeFragment)
    : [];
  const localTeachingContent = readTeachingContentFromPage(relativePagePath);
  const clientTeachingContent = normalizeWhitespace(pageContent || "");
  const teachingContent = localTeachingContent || clientTeachingContent;
  const fallbackAvailable = Boolean(clientTeachingContent && localTeachingContent && clientTeachingContent !== localTeachingContent);
  const primaryExtractionQuality = bookSection
    ? estimateExtractionQuality(bookSection.content || bookSection.excerpt || "", bookSection.extractionSources)
    : "";

  const contextPackage = {
    version: "ai-03-context-package-v1",
    sectionId,
    difficulty,
    primarySource: bookSection ? {
      type: "book_pdf",
      chapterId: bookSection.chapterId,
      itemId: bookSection.itemId,
      topicTitle: bookSection.topicTitle,
      pdfChapterNumber: bookSection.pdfChapterNumber,
      pdfChapterTitle: bookSection.pdfChapterTitle,
      pageStart: bookSection.pageStart,
      pageEnd: bookSection.pageEnd,
      referenceCount: bookSection.referenceCount,
      needsReview: bookSection.needsReview,
      extractionSources: bookSection.extractionSources,
      extractionQuality: primaryExtractionQuality,
      content: truncateText(bookSection.content || bookSection.excerpt || "", MAX_BOOK_CHARS)
    } : null,
    teachingSource: teachingContent ? {
      type: localTeachingContent ? "app_html" : "client_page_context",
      path: relativePagePath,
      title: pageTitle,
      subtitle: pageSubtitle,
      content: truncateText(teachingContent, MAX_TEACHING_CHARS)
    } : null,
    fallbackSource: fallbackAvailable ? {
      type: "client_page_context",
      available: true,
      content: truncateText(clientTeachingContent, MAX_FALLBACK_CHARS)
    } : null,
    topicIndex: topicIndexEntry ? {
      primaryTopic: topicIndexEntry.primaryTopic || "",
      transversalTopics: Array.isArray(topicIndexEntry.transversalTopics) ? topicIndexEntry.transversalTopics : [],
      advancedSupportTopics: Array.isArray(topicIndexEntry.advancedSupportTopics) ? topicIndexEntry.advancedSupportTopics : []
    } : null,
    relatedFragments,
    advancedSupportFragments
  };

  return {
    ...contextPackage,
    sourceReferences: buildSourceReferences(contextPackage),
    meta: {
      hasPrimaryBookSource: Boolean(contextPackage.primarySource),
      hasTeachingSource: Boolean(contextPackage.teachingSource),
      relatedFragmentCount: relatedFragments.length,
      advancedSupportFragmentCount: advancedSupportFragments.length,
      topicIndexFound: Boolean(topicIndexEntry)
    }
  };
}

export function buildAiExerciseContextPrompt(contextPackage = {}) {
  if (!contextPackage || (!contextPackage.primarySource && !contextPackage.teachingSource)) {
    return "";
  }

  const lines = [
    "Pacote de contexto priorizado para este exercicio:",
    "",
    "Hierarquia obrigatoria das fontes:",
    "1. PDF do livro: fonte canonica para definicoes, equacoes, sinais e convencoes.",
    "2. HTML da pagina: fonte pedagogica para nivel, linguagem e foco do item estudado.",
    "3. Contexto complementar: use apenas para conexoes seguras; nao substitui o PDF.",
    ""
  ];

  if (contextPackage.primarySource) {
    const primary = contextPackage.primarySource;
    lines.push(
      "Fonte canonica - PDF do livro:",
      `- secao_app: ${contextPackage.sectionId || primary.itemId}`,
      `- titulo: ${primary.topicTitle}`,
      `- pdf: capitulo ${primary.pdfChapterNumber} (${primary.pdfChapterTitle}), paginas ${primary.pageStart}${primary.pageEnd && primary.pageEnd !== primary.pageStart ? `-${primary.pageEnd}` : ""}`,
      primary.extractionQuality && primary.extractionQuality !== "clean"
        ? `- qualidade_da_extracao: ${primary.extractionQuality}. Se o texto extraido estiver ruidoso, use o PDF como ancora de referencia e use o HTML para linguagem/foco pedagogico.`
        : "",
      `- trecho: ${primary.content}`,
      ""
    );
  }

  if (contextPackage.teachingSource) {
    const teaching = contextPackage.teachingSource;
    lines.push(
      "Fonte pedagogica - pagina do app:",
      `- caminho: ${teaching.path || "contexto enviado pela pagina"}`,
      `- titulo: ${teaching.title || ""}`,
      teaching.subtitle ? `- subtitulo: ${teaching.subtitle}` : "",
      `- texto: ${teaching.content}`,
      ""
    );
  }

  if (contextPackage.topicIndex) {
    lines.push(
      "Indice tematico:",
      `- topico principal: ${contextPackage.topicIndex.primaryTopic || "nao informado"}`,
      `- topicos centrais relacionados: ${(contextPackage.topicIndex.transversalTopics || []).join(", ") || "nenhum"}`,
      contextPackage.topicIndex.advancedSupportTopics?.length
        ? `- topicos de apoio avancado: ${contextPackage.topicIndex.advancedSupportTopics.join(", ")}`
        : "",
      ""
    );
  }

  if (Array.isArray(contextPackage.relatedFragments) && contextPackage.relatedFragments.length) {
    lines.push("Fragmentos relacionados centrais, para conexoes seguras:");
    contextPackage.relatedFragments.forEach(function (fragment, index) {
      lines.push(
        `${index + 1}. ${fragment.topicLabel} | item ${fragment.sectionId} (${fragment.title}) | PDF p.${fragment.pageStart}${fragment.pageEnd && fragment.pageEnd !== fragment.pageStart ? `-${fragment.pageEnd}` : ""}: ${fragment.excerpt}`
      );
    });
    lines.push("");
  }

  if (Array.isArray(contextPackage.advancedSupportFragments) && contextPackage.advancedSupportFragments.length) {
    lines.push(
      "Fragmentos de apoio avancado:",
      "Use estes fragmentos somente se a dificuldade for dificil e se eles ajudarem sem deslocar o assunto central."
    );
    contextPackage.advancedSupportFragments.forEach(function (fragment, index) {
      lines.push(
        `${index + 1}. ${fragment.topicLabel} | item ${fragment.sectionId} (${fragment.title}) | PDF p.${fragment.pageStart}${fragment.pageEnd && fragment.pageEnd !== fragment.pageStart ? `-${fragment.pageEnd}` : ""}: ${fragment.excerpt}`
      );
    });
    lines.push("");
  }

  if (contextPackage.fallbackSource?.available) {
    lines.push(
      "Contexto fallback enviado pela pagina:",
      contextPackage.fallbackSource.content,
      ""
    );
  }

  lines.push(
    "Regras especificas do pacote:",
    "- O exercicio deve nascer da fonte canonica principal quando ela existir.",
    "- Se houver diferenca entre PDF e HTML, preserve a definicao/equacao do PDF e use o HTML apenas para calibrar a abordagem.",
    "- Nao transforme fragmentos relacionados em assunto central de exercicio facil ou medio.",
    "- Para dificuldade facil, fique no topico central da pagina.",
    "- Para dificuldade media, pode usar uma conexao central curta se ela estiver nos topicos relacionados.",
    "- Para dificuldade dificil, pode usar apoio avancado, mas mantendo a pagina atual como ancora."
  );

  return lines.filter(Boolean).join("\n");
}
