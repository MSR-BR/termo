import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../data");
const GRAPH = JSON.parse(readFileSync(resolve(DATA_DIR, "termo-concept-graph-v1.json"), "utf8"));
const SECTION_BY_KEY = new Map((GRAPH.sections || []).map((section) => [section.sectionKey, section]));

export const ADAPTIVE_POLICY_VERSION = "termo-gamification-policy/1.1.0";

function normalizeConfidence(value) {
  return ["low", "medium", "high"].includes(value) ? value : "not_reported";
}

export function getSectionEvidence(chapterId, sectionId) {
  return SECTION_BY_KEY.get(`${String(chapterId || "").padStart(2, "0")}:${sectionId}`) || null;
}

export function enrichFeedbackWithEvidence({ chapterId, feedback = [], answers = [] }) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  return feedback.map((item) => {
    const answer = answerByQuestion.get(item.questionId) || {};
    const section = getSectionEvidence(chapterId, item.reviewItem);
    const helpUsed = answer.helpUsed === true;
    const solutionRevealed = answer.solutionRevealed === true;
    const confidence = normalizeConfidence(answer.confidence);
    const evidenceClass = solutionRevealed
      ? "solution_revealed"
      : helpUsed
        ? "correct_with_help"
        : item.isCorrect && confidence === "low"
          ? "correct_low_confidence"
          : item.isCorrect
            ? "independent_retrieval"
            : "incorrect";

    return {
      ...item,
      confidence,
      helpUsed,
      solutionRevealed,
      evidenceClass,
      masteryEligible: evidenceClass === "independent_retrieval",
      conceptIds: section?.conceptIds || [],
      sourceIds: section?.sourceIds || []
    };
  });
}

function dayOf(value) {
  return String(value || "").slice(0, 10);
}

export function evaluateChapterMastery(attemptRows = [], chapterId = "") {
  const qualifying = attemptRows
    .filter((attempt) => String(attempt.chapter_id || "").padStart(2, "0") === String(chapterId || "").padStart(2, "0"))
    .filter((attempt) => attempt.attempt_type === "full_quiz")
    .filter((attempt) => Number(attempt.score || 0) >= 80)
    .filter((attempt) => {
      const feedback = Array.isArray(attempt.feedback) ? attempt.feedback : [];
      const correctFeedback = feedback.filter((item) => item.isCorrect === true);
      return correctFeedback.length > 0 && correctFeedback.every((item) => item.masteryEligible === true);
    });
  const distinctDays = new Set(qualifying.map((attempt) => dayOf(attempt.completed_at)).filter(Boolean));
  const distinctForms = new Set(qualifying.map((attempt) => String(attempt.quiz_key || "")).filter(Boolean));
  const mastered = qualifying.length >= 2 && distinctDays.size >= 2 && distinctForms.size >= 2;

  return {
    mastered,
    qualifyingRetrievals: qualifying.length,
    distinctSessions: distinctDays.size,
    distinctRepresentations: distinctForms.size,
    minimumIndependentRetrievals: 2,
    minimumDistinctSessions: 2,
    minimumDistinctRepresentations: 2
  };
}

export function buildAdaptiveNextAction({ chapterId, missedFeedback = [], mastery = null }) {
  const firstMiss = missedFeedback[0] || null;
  if (firstMiss) {
    return {
      type: "guided_review",
      label: `Retomar item ${firstMiss.reviewItem || "indicado"}`,
      href: firstMiss.reviewPath || `index.html?view=chapters&chapter=${chapterId}`,
      reason: firstMiss.reviewWhy || "A ultima tentativa mostrou uma lacuna especifica.",
      source: firstMiss.reviewTitle || `Capitulo ${chapterId}`,
      estimatedMinutes: 5,
      alternative: {
        label: `Voltar ao Capitulo ${chapterId}`,
        href: `index.html?view=chapters&chapter=${chapterId}`
      }
    };
  }

  if (mastery?.mastered) {
    return {
      type: "interleaved_review",
      label: "Fazer revisao intercalada depois",
      href: `index.html?view=journey&section=quiz&chapter=${chapterId}&stage=after`,
      reason: "Duas recuperacoes independentes em dias e formas distintas sustentam este dominio.",
      source: `Evidencias do Capitulo ${chapterId}`,
      estimatedMinutes: 6,
      alternative: {
        label: `Reabrir Capitulo ${chapterId}`,
        href: `index.html?view=chapters&chapter=${chapterId}`
      }
    };
  }

  return {
    type: "near_transfer_retry",
    label: "Fazer nova recuperacao em outro dia",
    href: `index.html?view=journey&section=quiz&chapter=${chapterId}&stage=after`,
    reason: "Um bom resultado isolado ainda nao basta para declarar dominio.",
    source: `Simulado do Capitulo ${chapterId}`,
    estimatedMinutes: 8,
    alternative: {
      label: `Continuar estudando o Capitulo ${chapterId}`,
      href: `index.html?view=chapters&chapter=${chapterId}`
    }
  };
}

export function getConceptGraph() {
  return GRAPH;
}
