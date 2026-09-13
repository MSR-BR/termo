import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildChapterBookContext,
  getBookSectionContext,
  loadBookSectionCorpus
} from "./book-section-corpus.mjs";
import {
  getSectionTopicIndex,
  loadBookTopicIndex
} from "./book-topic-index.mjs";
import {
  summarizeMathContractResult,
  validateMathTextContract
} from "./math-format-validator.mjs";
import { getEditorialRegistry } from "./editorial-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_AI_QUIZ_QUESTION_COUNT = 5;
const DAILY_CHALLENGE_QUESTION_COUNT = 1;
const DAILY_CHALLENGE_STAGE = "daily-challenge";
const AI_QUIZ_TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const AI_QUIZ_STAGE_LABELS = {
  before: "diagnostico antes do capitulo",
  during: "checagem durante o estudo",
  after: "revisao depois do capitulo",
  [DAILY_CHALLENGE_STAGE]: "desafio do dia"
};

const CHAPTER_SOURCES = getEditorialRegistry().chapters.map(function (chapter) {
  return {
    id: chapter.chapterId,
    title: chapter.title,
    data: String(chapter.dataFile || "").replace(/^data\//, ""),
    active: chapter.publicAvailable === true && chapter.aiExerciseEligible === true
  };
});

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function getTokenSecret(env = process.env) {
  return String(
    env.TERMO_QUIZ_TOKEN_SECRET ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.GEMINI_API_KEY ||
    "termo-local-ai-quiz-token"
  );
}

function getTokenKey(env = process.env) {
  return createHash("sha256").update(getTokenSecret(env)).digest();
}

export function sealAiQuizToken(quiz, env = process.env) {
  const key = getTokenKey(env);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = JSON.stringify({
    v: 1,
    exp: Date.now() + AI_QUIZ_TOKEN_TTL_MS,
    quiz
  });
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    base64UrlEncode(iv),
    base64UrlEncode(tag),
    base64UrlEncode(encrypted)
  ].join(".");
}

export function openAiQuizToken(token, env = process.env) {
  try {
    const [ivPart, tagPart, encryptedPart] = String(token || "").split(".");
    if (!ivPart || !tagPart || !encryptedPart) return null;

    const decipher = createDecipheriv("aes-256-gcm", getTokenKey(env), base64UrlDecode(ivPart));
    decipher.setAuthTag(base64UrlDecode(tagPart));
    const decrypted = Buffer.concat([
      decipher.update(base64UrlDecode(encryptedPart)),
      decipher.final()
    ]);
    const payload = JSON.parse(decrypted.toString("utf8"));

    if (payload?.v !== 1 || !payload.quiz || Number(payload.exp || 0) < Date.now()) {
      return null;
    }

    return payload.quiz;
  } catch {
    return null;
  }
}

function readChapterData(source) {
  const parsed = JSON.parse(readFileSync(resolve(DATA_DIR, source.data), "utf8"));
  return {
    ...source,
    description: parsed.description || "",
    topics: Array.isArray(parsed.topics) ? parsed.topics : []
  };
}

export function listAiQuizChapters() {
  return CHAPTER_SOURCES
    .map(readChapterData)
    .filter(function (chapter) {
      return chapter.active && chapter.topics.length > 0;
    });
}

export function listAiQuizChapterSummaries() {
  return listAiQuizChapters().map(function (chapter) {
    return {
      chapterId: chapter.id,
      quizKey: `ai-cap${chapter.id}`,
      chapterCode: `Capitulo ${chapter.id}`,
      chapterTitle: chapter.title,
      questionCount: DEFAULT_AI_QUIZ_QUESTION_COUNT,
      source: "ai_generated_on_demand"
    };
  });
}

export function findAiQuizChapter(chapterId) {
  const normalizedId = String(chapterId || "").padStart(2, "0");
  return listAiQuizChapters().find(function (chapter) {
    return chapter.id === normalizedId;
  }) || null;
}

function normalizeStage(stage = "") {
  const normalized = String(stage || "").trim().toLowerCase();
  return AI_QUIZ_STAGE_LABELS[normalized] ? normalized : "during";
}

function getQuestionCountForStage(stage = "") {
  return stage === DAILY_CHALLENGE_STAGE
    ? DAILY_CHALLENGE_QUESTION_COUNT
    : DEFAULT_AI_QUIZ_QUESTION_COUNT;
}

function buildChapterContext(chapter) {
  return chapter.topics.map(function (topic, index) {
    return [
      `${index + 1}. item ${topic.id || ""}`,
      `titulo: ${topic.title || ""}`,
      topic.note ? `nota: ${topic.note}` : "",
      topic.url ? `url: ${topic.url}` : ""
    ].filter(Boolean).join(" | ");
  }).join("\n");
}

function truncateText(value = "", maxChars = 1200) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

function formatPdfPages(section = {}) {
  if (!section?.pageStart) return "";
  return section.pageEnd && section.pageEnd !== section.pageStart
    ? `${section.pageStart}-${section.pageEnd}`
    : String(section.pageStart);
}

function buildChapterSourceReferences(chapter) {
  return (chapter.topics || []).map(function (topic) {
    const section = getBookSectionContext({
      chapterId: chapter.id,
      itemId: topic.id,
      pagePath: topic.url,
      pageTitle: topic.title
    });

    return {
      itemId: String(topic.id || "").trim(),
      title: String(topic.title || "").trim(),
      path: String(topic.url || "").trim(),
      pdfChapterNumber: section?.pdfChapterNumber || "",
      pdfChapterTitle: section?.pdfChapterTitle || "",
      pageStart: section?.pageStart || 0,
      pageEnd: section?.pageEnd || 0,
      needsReview: Boolean(section?.needsReview)
    };
  });
}

function buildChapterTopicMap(chapter) {
  const rows = (chapter.topics || []).map(function (topic) {
    const sectionId = String(topic.id || "").trim();
    const entry = getSectionTopicIndex(sectionId);
    if (!entry) {
      return `${sectionId}: ${topic.title || ""}`;
    }

    return [
      `${sectionId}: ${topic.title || ""}`,
      entry.primaryTopic ? `topico_principal=${entry.primaryTopic}` : "",
      Array.isArray(entry.transversalTopics) && entry.transversalTopics.length
        ? `transversais=${entry.transversalTopics.join(", ")}`
        : "",
      Array.isArray(entry.advancedSupportTopics) && entry.advancedSupportTopics.length
        ? `apoio_avancado=${entry.advancedSupportTopics.join(", ")}`
        : ""
    ].filter(Boolean).join(" | ");
  });

  return rows.join("\n");
}

function buildChapterCorpusMeta(chapter) {
  const corpus = loadBookSectionCorpus();
  const chapterMeta = (Array.isArray(corpus.chapters) ? corpus.chapters : []).find(function (entry) {
    return String(entry.chapterId || "").padStart(2, "0") === chapter.id;
  }) || null;
  const topicIndex = loadBookTopicIndex();
  const indexedSections = (Array.isArray(topicIndex.sectionIndex) ? topicIndex.sectionIndex : []).filter(function (entry) {
    return String(entry.chapterId || "").padStart(2, "0") === chapter.id;
  });

  return {
    pdfChapterNumber: chapterMeta?.pdfChapterNumber || "",
    pdfChapterTitle: chapterMeta?.pdfChapterTitle || "",
    pageStart: chapterMeta?.pageStart || 0,
    pageEnd: chapterMeta?.pageEnd || 0,
    topicCount: chapter.topics.length,
    indexedTopicCount: indexedSections.length,
    generatedAt: corpus.generatedAt || ""
  };
}

export function buildAiChapterQuizContextPackage(chapter) {
  const sourceReferences = buildChapterSourceReferences(chapter);
  const meta = buildChapterCorpusMeta(chapter);
  const bookContext = buildChapterBookContext(chapter, {
    maxCharsPerTopic: 760,
    maxTopics: Math.max(24, chapter.topics.length)
  });
  const topicMap = buildChapterTopicMap(chapter);

  return {
    meta,
    sourceReferences,
    bookContext,
    topicMap
  };
}

function buildAiQuizContextPrompt(contextPackage = {}) {
  const references = Array.isArray(contextPackage.sourceReferences) ? contextPackage.sourceReferences : [];
  const meta = contextPackage.meta || {};
  const noisyReferences = references.filter((reference) => reference.needsReview);

  return `
Pacote de contexto canonico para o simulado:
- Fonte principal: PDF do livro TERMO, capitulo ${meta.pdfChapterNumber || ""} (${meta.pdfChapterTitle || ""}), paginas ${meta.pageStart || "?"}-${meta.pageEnd || "?"}.
- Use os trechos do PDF abaixo para definicoes, equacoes, sinais e convencoes.
- Use os topicos HTML apenas para alinhar linguagem, nivel e item de retomada.
- Se um trecho extraido do PDF estiver ruidoso, use-o como ancora de pagina/conceito e use o resumo HTML para redacao, sem inventar formulas.
- O simulado deve cobrir itens diferentes do capitulo e manter foco no capitulo ${meta.pdfChapterTitle || ""}.
- Cada questao deve apontar um item real de retomada do app.

Mapa tematico por item:
${contextPackage.topicMap || "Indice tematico indisponivel."}

Trechos canonicos por item:
${contextPackage.bookContext || "Corpus do livro indisponivel; use os topicos publicados do app com cautela."}

Referencias de paginas PDF por item:
${references.map(function (reference) {
  return `- item ${reference.itemId}: ${reference.title} | PDF p.${formatPdfPages(reference)} | ${reference.path}`;
}).join("\n")}
${noisyReferences.length ? `\nAtencao: estes itens precisam de leitura com apoio do HTML por extracao ruidosa: ${noisyReferences.map((reference) => reference.itemId).join(", ")}.` : ""}
`.trim();
}

function buildAiQuizPrompt({ chapter, stage, contextPackage, questionCount }) {
  const stageLabel = AI_QUIZ_STAGE_LABELS[stage] || AI_QUIZ_STAGE_LABELS.during;
  const contextPrompt = buildAiQuizContextPrompt(contextPackage);
  const coverageRule = questionCount === 1
    ? "- Escolher um unico item publicado do capitulo e formular uma pergunta curta e autocontida."
    : "- Cobrir partes diferentes do capitulo, seguindo a ordem do programa de estudos.";

  return `
Voce e um professor de Termodinamica criando um simulado de multipla escolha para o app TERMO.

Capitulo: ${chapter.id} - ${chapter.title}
Descricao: ${chapter.description}
Momento metodologico: ${stageLabel}

${contextPrompt}

Topicos publicados do capitulo:
${buildChapterContext(chapter)}

Crie exatamente ${questionCount} ${questionCount === 1 ? "questao" : "questoes"} em portugues.

Regras pedagogicas:
${coverageRule}
- Usar o PDF do livro como fonte principal para conceito, formula e convencao.
- Nao usar topicos transversais como assunto central se eles nao forem o foco do item escolhido.
- O simulado deve servir antes, durante ou depois do estudo: diagnosticar, consolidar e apontar retomada.
- Evitar pegadinhas artificiais e evitar depender de memorizacao literal.
- Cada questao deve ter 4 alternativas: a, b, c, d.
- Cada questao deve apontar um item de retomada real do capitulo.
- A retomada curta deve ter uma pergunta simples com 2 alternativas, para revisar o erro.
- Nao mencione que foi gerado por IA no texto da questao.
- Se usar equacoes, toda expressao matematica deve estar em LaTeX com delimitadores \\( ... \\) ou \\[ ... \\].
- Como a resposta e JSON, cada barra invertida dentro das strings precisa estar duplicada: escreva \\\\( ... \\\\), \\\\[ ... \\\\] e \\\\frac.
- Nunca use $...$, $$...$$, colchetes soltos, nem formulas ASCII cruas como F = U - TS fora de delimitadores.

Responda SOMENTE com JSON valido, sem markdown:
{
  "note": "frase curta explicando o foco do simulado",
  "questions": [
    {
      "prompt": "enunciado da questao",
      "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
      "correct": "a",
      "explanation": "explicacao curta da resposta correta",
      "reviewItem": "1.1",
      "reviewTitle": "titulo do item de retomada",
      "reviewPath": "slides/capitulo-01/page_2.html",
      "reviewWhy": "por que revisar este item",
      "reviewCheck": {
        "prompt": "pergunta curta de retomada",
        "options": { "a": "...", "b": "..." },
        "correct": "a",
        "reinforcement": "reforco curto"
      }
    }
  ]
}
`.trim();
}

function extractJsonText(value = "") {
  const raw = String(value || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }
  return raw;
}

function repairInvalidJsonEscapes(value = "") {
  return String(value || "").replace(/(^|[^\\])\\(?!["\\/bfnrtu])/g, "$1\\\\");
}

const RAW_LATEX_JSON_ESCAPE_PATTERN =
  /(^|[^\\])\\(?=(?:[\[\]()]|(?:alpha|bar|begin|beta|cdot|Delta|delta|epsilon|eta|exp|frac|gamma|ge|hat|infty|int|kappa|lambda|le|left|lim|ln|mathit|mathbf|mathrm|mu|nabla|neq|nu|Omega|overline|partial|Phi|phi|rho|rightarrow|right|sigma|sqrt|sum|tau|text|theta|Theta|tilde|times|to|varepsilon|zeta)\b))/g;

function hasRawLatexJsonEscapes(value = "") {
  RAW_LATEX_JSON_ESCAPE_PATTERN.lastIndex = 0;
  return RAW_LATEX_JSON_ESCAPE_PATTERN.test(String(value || ""));
}

function repairRawLatexJsonEscapes(value = "") {
  RAW_LATEX_JSON_ESCAPE_PATTERN.lastIndex = 0;
  return String(value || "").replace(RAW_LATEX_JSON_ESCAPE_PATTERN, "$1\\\\");
}

function parseGeneratedJson(raw = "") {
  const source = String(raw || "");
  const candidates = hasRawLatexJsonEscapes(source)
    ? [
        repairInvalidJsonEscapes(repairRawLatexJsonEscapes(source)),
        repairRawLatexJsonEscapes(source),
        source,
        repairInvalidJsonEscapes(source)
      ]
    : [source, repairInvalidJsonEscapes(source)];
  const seen = new Set();
  let lastError = null;

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);

    try {
      return {
        ok: true,
        parsed: JSON.parse(candidate)
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    error: lastError
  };
}

function createCodedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function callGeminiJson({ env, prompt, temperature = 0.72 }) {
  const apiKey = String(env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw createCodedError("provider_not_configured", "GEMINI_API_KEY nao configurada.");
  }

  const model = String(env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        generationConfig: {
          temperature,
          responseMimeType: "application/json"
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const body = await response.json().catch(function () {
    return {};
  });

  if (!response.ok) {
    throw createCodedError("provider_request_failed", body?.error?.message || "Falha ao chamar Gemini.");
  }

  const text = body?.candidates?.[0]?.content?.parts?.map(function (part) {
    return part.text || "";
  }).join("\n") || "";
  const parsed = parseGeneratedJson(extractJsonText(text));

  if (!parsed.ok) {
    throw createCodedError("provider_invalid_json", parsed.error?.message || "A resposta da IA nao veio em JSON valido.");
  }

  return parsed.parsed;
}

function collectQuizMathFields(quiz = {}) {
  const fields = [
    { field: "note", value: quiz.note || "" }
  ];

  (Array.isArray(quiz.questions) ? quiz.questions : []).forEach(function (question, index) {
    const prefix = `questions[${index}]`;
    fields.push({ field: `${prefix}.prompt`, value: question.prompt || "" });
    Object.entries(question.options || {}).forEach(function ([key, value]) {
      fields.push({ field: `${prefix}.options.${key}`, value });
    });
    fields.push({ field: `${prefix}.explanation`, value: question.explanation || "" });
    fields.push({ field: `${prefix}.reviewWhy`, value: question.reviewWhy || "" });
    fields.push({ field: `${prefix}.reviewCheck.prompt`, value: question.reviewCheck?.prompt || "" });
    Object.entries(question.reviewCheck?.options || {}).forEach(function ([key, value]) {
      fields.push({ field: `${prefix}.reviewCheck.options.${key}`, value });
    });
    fields.push({ field: `${prefix}.reviewCheck.reinforcement`, value: question.reviewCheck?.reinforcement || "" });
  });

  return fields;
}

export function validateQuizMathContract(quiz = {}) {
  const fieldResults = collectQuizMathFields(quiz).map((entry) =>
    validateMathTextContract(entry.value || "", { field: entry.field })
  );
  const errors = fieldResults.flatMap((result) =>
    result.errors.map((error) => ({ ...error, field: result.field }))
  );
  const warnings = fieldResults.flatMap((result) =>
    result.warnings.map((warning) => ({ ...warning, field: result.field }))
  );

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    fields: fieldResults,
    mathSegmentCount: fieldResults.reduce((total, result) => total + result.mathSegmentCount, 0)
  };
}

function buildQuizMathRepairPrompt({ quizDraft = {}, mathContract = {} }) {
  return `
Revise o JSON de simulado abaixo e corrija SOMENTE a formatacao matematica.

Problemas detectados:
${JSON.stringify(summarizeMathContractResult(mathContract), null, 2)}

Regras:
- Preserve conteudo, alternativas corretas, ordem das questoes e itens de retomada.
- Toda expressao matematica deve estar dentro de \\( ... \\) ou \\[ ... \\].
- Nunca use $...$, $$...$$, colchetes soltos ou LaTeX cru fora de delimitadores.
- Retorne SOMENTE JSON valido no mesmo formato recebido.

JSON original:
${JSON.stringify(quizDraft, null, 2)}
`.trim();
}

async function repairQuizMathIfNeeded({ env, quizDraft }) {
  const initialContract = validateQuizMathContract(quizDraft);
  if (initialContract.ok) {
    return {
      quizDraft,
      mathContract: initialContract,
      mathRepairApplied: false
    };
  }

  let repairedDraft;
  try {
    repairedDraft = await callGeminiJson({
      env,
      temperature: 0.1,
      prompt: buildQuizMathRepairPrompt({
        quizDraft,
        mathContract: initialContract
      })
    });
  } catch (error) {
    error.mathContract = initialContract;
    throw error;
  }
  const repairedContract = validateQuizMathContract(repairedDraft);

  return {
    quizDraft: repairedDraft,
    mathContract: repairedContract,
    mathRepairApplied: true
  };
}

function normalizeOptionKey(value = "") {
  return String(value || "").trim().toLowerCase().slice(0, 1);
}

function getTopicFallback(chapter, index) {
  return chapter.topics[index % chapter.topics.length] || chapter.topics[0] || {};
}

function sanitizeGeneratedQuestion(question, index, chapter) {
  const fallbackTopic = getTopicFallback(chapter, index);
  const options = question?.options || {};
  const reviewCheck = question?.reviewCheck || {};
  const reviewOptions = reviewCheck.options || {};
  const correct = normalizeOptionKey(question?.correct);
  const reviewCorrect = normalizeOptionKey(reviewCheck.correct);
  const optionKeys = ["a", "b", "c", "d"];

  if (!question?.prompt || !optionKeys.every(function (key) { return options[key]; }) || !optionKeys.includes(correct)) {
    return null;
  }

  return {
    questionId: `ai-cap${chapter.id}-q${index + 1}`,
    prompt: String(question.prompt).trim(),
    options: {
      a: String(options.a).trim(),
      b: String(options.b).trim(),
      c: String(options.c).trim(),
      d: String(options.d).trim()
    },
    correct,
    explanation: String(question.explanation || "A alternativa correta segue diretamente do item indicado para retomada.").trim(),
    reviewItem: String(question.reviewItem || fallbackTopic.id || `${Number(chapter.id)}.${index + 1}`).trim(),
    reviewTitle: String(question.reviewTitle || fallbackTopic.title || "Retomada do capítulo").trim(),
    reviewPath: String(question.reviewPath || fallbackTopic.url || `index.html?view=chapters&chapter=${chapter.id}`).trim(),
    reviewWhy: String(question.reviewWhy || "Revise este item antes da proxima tentativa.").trim(),
    reviewCheck: {
      prompt: String(reviewCheck.prompt || "Qual alternativa resume melhor a retomada?").trim(),
      options: {
        a: String(reviewOptions.a || "A afirmacao principal do item de retomada.").trim(),
        b: String(reviewOptions.b || "Uma interpretacao que nao corresponde ao item.").trim()
      },
      correct: ["a", "b"].includes(reviewCorrect) ? reviewCorrect : "a",
      reinforcement: String(reviewCheck.reinforcement || "A retomada curta ajuda a fixar o ponto antes de refazer o simulado.").trim()
    }
  };
}

function buildMockAiQuiz({ chapter, stage, questionCount }) {
  const questions = Array.from({ length: questionCount }, function (_value, index) {
    const topic = getTopicFallback(chapter, index);
    return {
      questionId: `ai-cap${chapter.id}-q${index + 1}`,
      prompt: `Qual ideia melhor representa o item ${topic.id} - ${topic.title}?`,
      options: {
        a: topic.note || topic.title || "Ideia central do item.",
        b: "Um detalhe sem relacao direta com o capitulo.",
        c: "Uma conclusao oposta ao material.",
        d: "Uma definicao de outro capitulo."
      },
      correct: "a",
      explanation: `O item ${topic.id} trabalha diretamente esta ideia no capitulo.`,
      reviewItem: topic.id || `${Number(chapter.id)}.${index + 1}`,
      reviewTitle: topic.title || "Retomada do capitulo",
      reviewPath: topic.url || `index.html?view=chapters&chapter=${chapter.id}`,
      reviewWhy: "Retome o item para consolidar a ideia central antes da proxima tentativa.",
      reviewCheck: {
        prompt: `A retomada indicada esta ligada ao item ${topic.id}?`,
        options: {
          a: "Sim, e o item mais diretamente relacionado.",
          b: "Nao, e um item externo ao programa."
        },
        correct: "a",
        reinforcement: "Use a retomada para reler o trecho certo, nao para navegar sem foco."
      }
    };
  });

  return {
    quizKey: `ai-cap${chapter.id}-${stage}-mock`,
    chapterId: chapter.id,
    chapterCode: `Capitulo ${chapter.id}`,
    chapterTitle: chapter.title,
    note: `Simulado de ${AI_QUIZ_STAGE_LABELS[stage]} gerado para este capitulo.`,
    source: "ai_generated_on_demand",
    rewardXp: 30,
    rewardBonusXp: 15,
    questions
  };
}

function isMathSafeText(value = "") {
  return validateMathTextContract(value).ok;
}

function buildCanonicalDailyChallengeFallback(chapter, contextPackage) {
  const topics = (chapter.topics || []).filter(function (topic) {
    return topic?.id && topic?.title && topic?.url && isMathSafeText(topic.title);
  });

  if (topics.length < 4) return null;

  const target = topics[0];
  const distractors = topics.slice(1, 4);
  const targetIndex = Math.abs(Number.parseInt(chapter.id, 10) || 0) % 4;
  const optionTopics = distractors.slice();
  optionTopics.splice(targetIndex, 0, target);
  const optionKeys = ["a", "b", "c", "d"];
  const options = Object.fromEntries(optionKeys.map(function (key, index) {
    const topic = optionTopics[index];
    return [key, `Item ${topic.id} — ${topic.title}`];
  }));
  const safeNote = target.note && isMathSafeText(target.note)
    ? truncateText(target.note, 260)
    : "";
  const prompt = safeNote
    ? `Qual item do capítulo corresponde à descrição “${safeNote}”?`
    : `Qual item do capítulo aborda o tema “${target.title}”?`;
  const correct = optionKeys[targetIndex];
  const question = {
    questionId: `fallback-cap${chapter.id}-q1`,
    prompt,
    options,
    correct,
    explanation: `A retomada indicada é o item ${target.id} — ${target.title}.`,
    reviewItem: target.id,
    reviewTitle: target.title,
    reviewPath: target.url,
    reviewWhy: `Retome o item ${target.id} para revisar esse tema no material publicado.`,
    reviewCheck: {
      prompt: `O item ${target.id} é a retomada indicada para esse tema?`,
      options: {
        a: "Sim, é o item diretamente relacionado.",
        b: "Não, é um item de outro tema."
      },
      correct: "a",
      reinforcement: `O item ${target.id} reúne a explicação publicada para essa retomada.`
    }
  };
  const quizHash = createHash("sha256")
    .update(JSON.stringify({ chapterId: chapter.id, stage: DAILY_CHALLENGE_STAGE, question }))
    .digest("hex")
    .slice(0, 10);
  const quiz = {
    quizKey: `fallback-cap${chapter.id}-${DAILY_CHALLENGE_STAGE}-${quizHash}`,
    chapterId: chapter.id,
    chapterCode: `Capitulo ${chapter.id}`,
    chapterTitle: chapter.title,
    note: "Pergunta de contingência criada a partir do conteúdo publicado do capítulo.",
    source: "canonical_daily_challenge_fallback",
    rewardXp: 30,
    rewardBonusXp: 15,
    questions: [question],
    sourceReferences: contextPackage.sourceReferences || [],
    contextPackageMeta: contextPackage.meta || {},
    mathContractOk: true,
    mathRepairApplied: false
  };
  const mathContract = validateQuizMathContract(quiz);

  if (!mathContract.ok) return null;
  quiz.mathContract = summarizeMathContractResult(mathContract);
  return quiz;
}

function buildSafeGenerationDiagnostic({ chapter, stage, env, error }) {
  const summarizedContract = error?.mathContract
    ? summarizeMathContractResult(error.mathContract)
    : null;

  return {
    event: stage === DAILY_CHALLENGE_STAGE
      ? "daily_challenge_generation_fallback"
      : "chapter_quiz_generation_failed",
    chapterId: chapter.id,
    stage,
    model: String(env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL),
    errorCode: String(error?.code || "ai_quiz_generation_failed"),
    mathRepairAttempted: Boolean(error?.mathContract),
    mathErrorCodes: summarizedContract?.errors?.map(function (item) {
      return `${item.field}:${item.code}`;
    }) || []
  };
}

export async function generateAiChapterQuiz({ chapterId, stage = "during", env = process.env } = {}) {
  const chapter = findAiQuizChapter(chapterId);
  if (!chapter) {
    return {
      ok: false,
      status: 404,
      error: "Este capitulo ainda nao tem conteudo suficiente para gerar simulado."
    };
  }

  const normalizedStage = normalizeStage(stage);
  const questionCount = getQuestionCountForStage(normalizedStage);
  const contextPackage = buildAiChapterQuizContextPackage(chapter);

  try {
    const rawQuizDraft = env.TERMO_AI_QUIZ_MOCK === "true"
      ? buildMockAiQuiz({ chapter, stage: normalizedStage, questionCount })
      : await callGeminiJson({
          env,
          temperature: normalizedStage === DAILY_CHALLENGE_STAGE ? 0.35 : 0.72,
          prompt: buildAiQuizPrompt({
            chapter,
            stage: normalizedStage,
            contextPackage,
            questionCount
          })
        });
    const repaired = env.TERMO_AI_QUIZ_MOCK === "true"
      ? {
          quizDraft: rawQuizDraft,
          mathContract: validateQuizMathContract(rawQuizDraft),
          mathRepairApplied: false
        }
      : await repairQuizMathIfNeeded({
          env,
          quizDraft: rawQuizDraft
        });
    const quizDraft = repaired.quizDraft || rawQuizDraft;
    const questions = (Array.isArray(quizDraft.questions) ? quizDraft.questions : [])
      .map(function (question, index) {
        return sanitizeGeneratedQuestion(question, index, chapter);
      })
      .filter(Boolean)
      .slice(0, questionCount);

    if (questions.length !== questionCount) {
      const incompleteError = new Error("Gemini retornou um simulado incompleto.");
      incompleteError.code = "incomplete_quiz";
      throw incompleteError;
    }

    const quizHash = createHash("sha256")
      .update(JSON.stringify({ chapterId: chapter.id, stage: normalizedStage, questions }))
      .digest("hex")
      .slice(0, 10);
    const quiz = {
      quizKey: `ai-cap${chapter.id}-${normalizedStage}-${quizHash}`,
      chapterId: chapter.id,
      chapterCode: `Capitulo ${chapter.id}`,
      chapterTitle: chapter.title,
      note: String(quizDraft.note || `Simulado de ${AI_QUIZ_STAGE_LABELS[normalizedStage]} gerado para este capitulo.`).trim(),
      source: "ai_generated_on_demand",
      rewardXp: 30,
      rewardBonusXp: 15,
      questions,
      sourceReferences: contextPackage.sourceReferences || [],
      contextPackageMeta: contextPackage.meta || {},
      mathContract: summarizeMathContractResult(repaired.mathContract),
      mathContractOk: Boolean(repaired.mathContract?.ok),
      mathRepairApplied: Boolean(repaired.mathRepairApplied)
    };
    const finalMathContract = validateQuizMathContract(quiz);

    if (!finalMathContract.ok) {
      const mathError = new Error("Simulado gerado com matematica fora do contrato de exibicao.");
      mathError.code = "math_contract_failed";
      mathError.mathContract = finalMathContract;
      throw mathError;
    }

    quiz.mathContract = summarizeMathContractResult(finalMathContract);
    quiz.mathContractOk = true;

    return {
      ok: true,
      quiz,
      quizToken: sealAiQuizToken(quiz, env)
    };
  } catch (error) {
    const diagnostic = buildSafeGenerationDiagnostic({
      chapter,
      stage: normalizedStage,
      env,
      error
    });
    console.warn("[termo-ai-quiz]", JSON.stringify(diagnostic));

    if (normalizedStage === DAILY_CHALLENGE_STAGE) {
      const fallbackQuiz = buildCanonicalDailyChallengeFallback(chapter, contextPackage);
      if (fallbackQuiz) {
        return {
          ok: true,
          quiz: fallbackQuiz,
          quizToken: sealAiQuizToken(fallbackQuiz, env),
          fallbackUsed: true,
          diagnostic
        };
      }
    }

    return {
      ok: false,
      status: 502,
      error: normalizedStage === DAILY_CHALLENGE_STAGE
        ? "Nao foi possivel preparar a pergunta do desafio agora."
        : (error?.message || "Nao foi possivel gerar o simulado por IA."),
      errorCode: diagnostic.errorCode,
      diagnostic
    };
  }
}
