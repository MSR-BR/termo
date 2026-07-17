import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_AI_QUIZ_QUESTION_COUNT = 5;
const AI_QUIZ_TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const AI_QUIZ_STAGE_LABELS = {
  before: "diagnostico antes do capitulo",
  during: "checagem durante o estudo",
  after: "revisao depois do capitulo"
};

const CHAPTER_SOURCES = [
  { id: "01", title: "Conceitos Fundamentais", data: "capitulo-01.json", active: true },
  { id: "02", title: "Potenciais Termodinamicos e Aplicacoes", data: "capitulo-02.json", active: true },
  { id: "03", title: "Termodinamica Estatistica", data: "capitulo-03.json", active: true },
  { id: "04", title: "Transicoes de Fase", data: "capitulo-04.json", active: true },
  { id: "05", title: "Processos Termodinamicos", data: "capitulo-05.json", active: false },
  { id: "06", title: "Ciclos Termodinamicos", data: "capitulo-06.json", active: true }
];

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

function buildAiQuizPrompt({ chapter, stage }) {
  const stageLabel = AI_QUIZ_STAGE_LABELS[stage] || AI_QUIZ_STAGE_LABELS.during;

  return `
Voce e um professor de Termodinamica criando um simulado de multipla escolha para o app TERMO.

Capitulo: ${chapter.id} - ${chapter.title}
Descricao: ${chapter.description}
Momento metodologico: ${stageLabel}

Topicos publicados do capitulo:
${buildChapterContext(chapter)}

Crie exatamente ${DEFAULT_AI_QUIZ_QUESTION_COUNT} questoes em portugues.

Regras pedagogicas:
- Cobrir partes diferentes do capitulo, seguindo a ordem do programa de estudos.
- O simulado deve servir antes, durante ou depois do estudo: diagnosticar, consolidar e apontar retomada.
- Evitar pegadinhas artificiais e evitar depender de memorizacao literal.
- Cada questao deve ter 4 alternativas: a, b, c, d.
- Cada questao deve apontar um item de retomada real do capitulo.
- A retomada curta deve ter uma pergunta simples com 2 alternativas, para revisar o erro.
- Nao mencione que foi gerado por IA no texto da questao.

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

async function callGeminiJson({ env, prompt }) {
  const apiKey = String(env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY nao configurada.");
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
          temperature: 0.72,
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
    throw new Error(body?.error?.message || "Falha ao chamar Gemini.");
  }

  const text = body?.candidates?.[0]?.content?.parts?.map(function (part) {
    return part.text || "";
  }).join("\n") || "";

  return JSON.parse(extractJsonText(text));
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

function buildMockAiQuiz({ chapter, stage }) {
  const questions = Array.from({ length: DEFAULT_AI_QUIZ_QUESTION_COUNT }, function (_value, index) {
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

  try {
    const quizDraft = env.TERMO_AI_QUIZ_MOCK === "true"
      ? buildMockAiQuiz({ chapter, stage: normalizedStage })
      : await callGeminiJson({
          env,
          prompt: buildAiQuizPrompt({ chapter, stage: normalizedStage })
        });
    const questions = (Array.isArray(quizDraft.questions) ? quizDraft.questions : [])
      .map(function (question, index) {
        return sanitizeGeneratedQuestion(question, index, chapter);
      })
      .filter(Boolean)
      .slice(0, DEFAULT_AI_QUIZ_QUESTION_COUNT);

    if (questions.length !== DEFAULT_AI_QUIZ_QUESTION_COUNT) {
      throw new Error("Gemini retornou um simulado incompleto.");
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
      questions
    };

    return {
      ok: true,
      quiz,
      quizToken: sealAiQuizToken(quiz, env)
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error?.message || "Nao foi possivel gerar o simulado por IA."
    };
  }
}

