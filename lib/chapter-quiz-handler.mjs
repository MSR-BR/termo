import {
  applyEventToProfile,
  buildEventDay,
  buildProfilePatchFromApplied,
  CHAPTER_EXCELLENCE_SCORE,
  CHAPTER_MASTERY_SCORE,
  ensureProfileRow,
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  fetchLatestQuizAttemptRow,
  insertQuizAttemptRow,
  isGamificationRpcEnabled,
  isNonEmptyString,
  jsonResponse,
  mapProfileRowToJourneyProfile,
  normalizeIsoTimestamp,
  parseJsonBody,
  patchProfileRow,
  readBearerToken,
  supabaseRpcRequest
} from "./gamification-shared.mjs";
import {
  findQuiz,
  gradeQuizSubmission,
  serializeQuizForClient
} from "./gamification-quiz-catalog.mjs";
import {
  generateAiChapterQuiz,
  listAiQuizChapterSummaries,
  openAiQuizToken
} from "./gamification-ai-quiz.mjs";

const ATTEMPT_TYPES = new Set(["full_quiz", "guided_review", "focused_retry"]);
const EVENT_TYPE_BY_ATTEMPT = {
  full_quiz: "chapter_quiz_completed",
  guided_review: "chapter_quiz_review_completed",
  focused_retry: "chapter_quiz_retry_completed"
};

function validateQuizSubmission(body) {
  const errors = [];
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!isNonEmptyString(body.quizKey)) {
    errors.push("quizKey e obrigatorio.");
  }

  if (!isNonEmptyString(body.chapterId)) {
    errors.push("chapterId e obrigatorio.");
  }

  if (!ATTEMPT_TYPES.has(body.attemptType)) {
    errors.push("attemptType invalido.");
  }

  if (!answers.length) {
    errors.push("answers precisa conter ao menos uma resposta.");
  }

  const invalidAnswer = answers.find(function (answer) {
    return !isNonEmptyString(answer?.questionId) || !isNonEmptyString(answer?.choice);
  });

  if (invalidAnswer) {
    errors.push("Cada resposta precisa ter questionId e choice.");
  }

  const duplicateQuestionIds = new Set();
  const repeatedAnswer = answers.find(function (answer) {
    const key = String(answer?.questionId || "").trim();
    if (!key || !duplicateQuestionIds.has(key)) {
      duplicateQuestionIds.add(key);
      return false;
    }
    return true;
  });

  if (repeatedAnswer) {
    errors.push("Nao envie duas respostas para a mesma questao.");
  }

  const startedAt = normalizeIsoTimestamp(body.startedAt);
  const completedAt = normalizeIsoTimestamp(body.completedAt);

  if (body.startedAt && !startedAt) {
    errors.push("startedAt precisa ser uma data valida.");
  }

  if (body.completedAt && !completedAt) {
    errors.push("completedAt precisa ser uma data valida.");
  }

  if (startedAt && completedAt && new Date(startedAt).getTime() > new Date(completedAt).getTime()) {
    errors.push("startedAt nao pode ser depois de completedAt.");
  }

  return {
    errors,
    normalized: {
      quizKey: String(body.quizKey || "").trim(),
      chapterId: String(body.chapterId || "").trim(),
      attemptType: String(body.attemptType || "").trim(),
      answers: answers.map(function (answer) {
        return {
          questionId: String(answer.questionId || "").trim(),
          choice: String(answer.choice || "").trim().toLowerCase()
        };
      }),
      startedAt,
      completedAt
    }
  };
}

function buildQuestionIdSet(quiz) {
  const ids = new Set();
  quiz.questions.forEach(function (question) {
    ids.add(question.questionId);
    if (question.reviewCheck) {
      ids.add(`${question.questionId}:review`);
    }
  });
  return ids;
}

function buildInvalidAnswerErrors(quiz, answers) {
  const questionIds = buildQuestionIdSet(quiz);
  const questionById = new Map(quiz.questions.map(function (question) {
    return [question.questionId, question];
  }));

  return answers.reduce(function (accumulator, answer) {
    if (!questionIds.has(answer.questionId)) {
      accumulator.push(`questionId desconhecido: ${answer.questionId}`);
    }

    if (String(answer.questionId || "").endsWith(":review")) {
      const sourceQuestionId = String(answer.questionId || "").replace(/:review$/, "");
      if (!questionById.get(sourceQuestionId)?.reviewCheck) {
        accumulator.push(`questionId nao possui retomada rapida: ${answer.questionId}`);
      }
    }

    if (!/^[a-z]$/.test(answer.choice)) {
      accumulator.push(`choice invalido para ${answer.questionId}`);
    }

    return accumulator;
  }, []);
}

function gradeFocusedSubmission({ quiz, answers = [] }) {
  const questionById = new Map(quiz.questions.map(function (question) {
    return [question.questionId, question];
  }));

  const feedback = answers.map(function (answer) {
    const rawQuestionId = String(answer.questionId || "");
    const isReviewCheck = rawQuestionId.endsWith(":review");
    const sourceQuestionId = rawQuestionId.replace(/:review$/, "");
    const question = questionById.get(sourceQuestionId);
    const reviewCheck = isReviewCheck ? question?.reviewCheck : null;
    const correctChoice = String(reviewCheck?.correct || question?.correct || "").trim().toLowerCase();
    const selectedChoice = String(answer.choice || "").trim().toLowerCase();
    const isCorrect = selectedChoice === correctChoice;

    return {
      questionId: rawQuestionId,
      prompt: reviewCheck?.prompt || question?.prompt || "",
      selectedChoice,
      correctChoice,
      isCorrect,
      explanation: isReviewCheck
        ? (isCorrect ? reviewCheck?.reinforcement : question?.reviewWhy || question?.explanation || "")
        : question?.explanation || "",
      reviewItem: question?.reviewItem || "",
      reviewTitle: question?.reviewTitle || "",
      reviewPath: question?.reviewPath || "",
      reviewWhy: question?.reviewWhy || "",
      reviewCheck: question?.reviewCheck || null
    };
  });

  const correctCount = feedback.filter(function (item) {
    return item.isCorrect;
  }).length;
  const questionCount = feedback.length;
  const score = questionCount
    ? Math.round((correctCount / questionCount) * 100)
    : 0;

  return {
    chapterId: quiz.chapterId,
    chapterTitle: quiz.chapterTitle,
    quizKey: quiz.quizKey,
    correctCount,
    questionCount,
    score,
    feedback,
    missedFeedback: feedback.filter(function (item) {
      return !item.isCorrect;
    })
  };
}

function findNextPublishedQuiz(currentChapterId) {
  const published = listAiQuizChapterSummaries()
    .slice()
    .sort(function (left, right) {
      return String(left.chapterId || "").localeCompare(String(right.chapterId || ""));
    });
  const currentIndex = published.findIndex(function (quiz) {
    return quiz.chapterId === currentChapterId;
  });

  if (currentIndex >= 0 && published[currentIndex + 1]) {
    return published[currentIndex + 1];
  }

  return null;
}

function buildQuizNextAction({ chapterId, result, attemptType }) {
  const firstMiss = result.missedFeedback[0] || null;
  const mastered = Number(result.score || 0) >= CHAPTER_MASTERY_SCORE;

  if (attemptType === "full_quiz" && mastered) {
    const nextQuiz = findNextPublishedQuiz(chapterId);
    if (nextQuiz) {
      return {
        type: "next_chapter_quiz",
        label: `Abrir simulado de Capitulo ${nextQuiz.chapterId}`,
        href: `index.html?view=journey&section=quiz&chapter=${nextQuiz.chapterId}`,
        reason: `Voce chegou a ${result.score}% neste simulado; o proximo passo segue a ordem do programa.`
      };
    }

    return {
      type: "chapter_mastered",
      label: `Revisar Capitulo ${chapterId}`,
      href: `index.html?view=chapters&chapter=${chapterId}`,
      reason: `Voce chegou a ${result.score}% e consolidou este ponto do programa.`
    };
  }

  if (firstMiss) {
    return {
      type: attemptType === "full_quiz" ? "guided_review" : "focused_retry",
      label: `Retomar item ${firstMiss.reviewItem} do Capitulo ${chapterId}`,
      href: firstMiss.reviewPath,
      reason: firstMiss.reviewWhy || "Ultimo erro do simulado pede revisao curta antes da proxima tentativa."
    };
  }

  if (attemptType !== "full_quiz") {
    return {
      type: "retry_full_quiz",
      label: `Tentar simulado do Capitulo ${chapterId} novamente`,
      href: `index.html?view=journey&section=quiz&chapter=${chapterId}`,
      reason: "Retomada curta concluida; agora vale testar o capitulo inteiro novamente."
    };
  }

  return {
    type: "chapter_continue",
    label: `Seguir no Capitulo ${chapterId}`,
    href: `index.html?view=chapters&chapter=${chapterId}`,
    reason: "Simulado concluido sem pendencias imediatas; manter o ritmo no capitulo."
  };
}

function computeAwardedXp({
  quiz,
  attemptType,
  result,
  hasPreviousFullQuiz
}) {
  if (attemptType === "full_quiz") {
    const mastered = Number(result.score || 0) >= CHAPTER_MASTERY_SCORE;
    const base = hasPreviousFullQuiz
      ? (mastered ? 5 : 0)
      : Number(quiz.rewardXp || 30);
    const bonus = !hasPreviousFullQuiz && mastered ? Number(quiz.rewardBonusXp || 0) : 0;
    return Math.max(0, base + bonus);
  }

  return result.correctCount === result.questionCount ? 10 : 0;
}

function buildQuizSummary({
  quiz,
  attemptType,
  result,
  xpAwarded,
  completedAt,
  nextAction
}) {
  const firstMiss = result.missedFeedback[0] || null;
  const isMastered = attemptType === "full_quiz" && Number(result.score || 0) >= CHAPTER_MASTERY_SCORE;
  const isExcellent = attemptType === "full_quiz" && Number(result.score || 0) >= CHAPTER_EXCELLENCE_SCORE;

  return {
    quizKey: quiz.quizKey,
    chapterId: quiz.chapterId,
    chapterTitle: quiz.chapterTitle,
    attemptType,
    correctCount: result.correctCount,
    total: result.questionCount,
    score: result.score,
    xpAwarded,
    isMastered,
    isExcellent,
    masteryThreshold: CHAPTER_MASTERY_SCORE,
    progressionStatus: isMastered ? "mastered" : "review_required",
    completedAt,
    recommendedReview: firstMiss ? {
      reviewItem: firstMiss.reviewItem,
      reviewTitle: firstMiss.reviewTitle,
      reviewPath: firstMiss.reviewPath
    } : null,
    nextAction
  };
}

function buildQuizResponse({
  user,
  quiz,
  quizToken = "",
  persistedAttempt,
  result,
  xpAwarded,
  nextAction,
  profileRow
}) {
  return {
    ok: true,
    contractVersion: "phase-1c-live",
    persisted: true,
    userId: user.id,
    quiz: {
      ...serializeQuizForClient(quiz),
      quizToken
    },
    attempt: {
      id: persistedAttempt.id,
      attemptType: persistedAttempt.attempt_type,
      score: Number(persistedAttempt.score || 0),
      correctCount: Number(persistedAttempt.correct_count || 0),
      questionCount: Number(persistedAttempt.question_count || 0),
      xpAwarded,
      startedAt: persistedAttempt.started_at,
      completedAt: persistedAttempt.completed_at
    },
    result: {
      score: result.score,
      correctCount: result.correctCount,
      questionCount: result.questionCount,
      feedback: result.feedback
    },
    nextAction,
    profile: mapProfileRowToJourneyProfile(user, profileRow)
  };
}

export async function handleChapterQuizRequest({
  method,
  headers = {},
  query = {},
  body,
  env = process.env
}) {
  if (!["GET", "HEAD", "POST"].includes(method || "GET")) {
    return jsonResponse(405, { error: "Use GET ou POST." });
  }

  if (method === "GET" || method === "HEAD") {
    const chapterId = String(query.chapterId || "").trim();
    const quizKey = String(query.quizKey || "").trim();
    const stage = String(query.stage || "").trim();

    if (!chapterId && !quizKey) {
      return jsonResponse(200, {
        ok: true,
        contractVersion: "phase-1c-live",
        source: "ai_generated_quiz_available",
        quizzes: listAiQuizChapterSummaries()
      });
    }

    if (chapterId) {
      const generated = await generateAiChapterQuiz({ chapterId, stage, env });
      if (generated.ok && generated.quiz) {
        return jsonResponse(200, {
          ok: true,
          contractVersion: "phase-1c-live",
          source: "ai_generated_on_demand",
          quiz: {
            ...serializeQuizForClient(generated.quiz),
            quizToken: generated.quizToken,
            source: generated.quiz.source || "ai_generated_on_demand"
          }
        });
      }

      const fallbackQuiz = findQuiz({ chapterId, quizKey });
      if (fallbackQuiz) {
        return jsonResponse(200, {
          ok: true,
          contractVersion: "phase-1c-live",
          source: "repo_versioned_quiz_catalog_fallback",
          warning: generated.error || "",
          quiz: serializeQuizForClient(fallbackQuiz)
        });
      }

      return jsonResponse(404, {
        error: generated.error || "Quiz nao encontrado.",
        requested: {
          chapterId,
          quizKey
        }
      });
    }

    const quiz = findQuiz({ chapterId, quizKey });
    if (!quiz) {
      return jsonResponse(404, {
        error: "Quiz nao encontrado.",
        requested: { chapterId, quizKey }
      });
    }

    return jsonResponse(200, {
      ok: true,
      contractVersion: "phase-1c-live",
      source: "repo_versioned_quiz_catalog",
      quiz: serializeQuizForClient(quiz)
    });
  }

  const config = ensureSupabaseServerConfig(env);
  if (!config) {
    return jsonResponse(500, {
      error: "Gamificacao ainda nao configurada.",
      details: "Configure PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY antes da integracao real."
    });
  }

  const accessToken = readBearerToken(headers);
  if (!accessToken) {
    return jsonResponse(401, {
      error: "Entre com Google para enviar o simulado."
    });
  }

  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });

  if (!user?.id) {
    return jsonResponse(401, {
      error: "Nao foi possivel validar sua sessao."
    });
  }

  const requestBody = parseJsonBody(body);
  const validation = validateQuizSubmission(requestBody);

  if (validation.errors.length) {
    return jsonResponse(422, {
      error: "Payload invalido.",
      details: validation.errors
    });
  }

  const normalizedAttempt = validation.normalized;
  const quizFromToken = requestBody.quizToken
    ? openAiQuizToken(requestBody.quizToken, env)
    : null;
  const quiz = quizFromToken || findQuiz({
    chapterId: normalizedAttempt.chapterId,
    quizKey: normalizedAttempt.quizKey
  });

  if (!quiz) {
    return jsonResponse(404, {
      error: "Quiz nao encontrado.",
      details: "Abra o simulado novamente para gerar questoes validas."
    });
  }

  if (quiz.chapterId !== normalizedAttempt.chapterId || quiz.quizKey !== normalizedAttempt.quizKey) {
    return jsonResponse(422, {
      error: "quizKey e chapterId precisam apontar para o mesmo quiz."
    });
  }

  const answerErrors = buildInvalidAnswerErrors(quiz, normalizedAttempt.answers);
  if (answerErrors.length) {
    return jsonResponse(422, {
      error: "Respostas invalidas.",
      details: answerErrors
    });
  }

  const profileResult = await ensureProfileRow({
    config,
    userId: user.id
  });

  if (!profileResult.ok || !profileResult.row) {
    return jsonResponse(profileResult.status || 500, {
      error: "Nao foi possivel preparar sua jornada.",
      details: profileResult.error || "profile_prepare_failed"
    });
  }

  const previousFullQuizAttempt = await fetchLatestQuizAttemptRow({
    config,
    userId: user.id,
    quizKey: quiz.quizKey,
    attemptType: "full_quiz"
  });

  if (!previousFullQuizAttempt.ok) {
    return jsonResponse(previousFullQuizAttempt.status || 500, {
      error: "Nao foi possivel verificar seu historico de quiz.",
      details: previousFullQuizAttempt.error || "quiz_history_check_failed"
    });
  }

  const startedAt = normalizedAttempt.startedAt || normalizedAttempt.completedAt || new Date().toISOString();
  const completedAt = normalizedAttempt.completedAt || new Date().toISOString();
  const result = normalizedAttempt.attemptType === "full_quiz"
    ? gradeQuizSubmission({
        quiz,
        answers: normalizedAttempt.answers
      })
    : gradeFocusedSubmission({
        quiz,
        answers: normalizedAttempt.answers
      });
  const xpAwarded = computeAwardedXp({
    quiz,
    attemptType: normalizedAttempt.attemptType,
    result,
    hasPreviousFullQuiz: Boolean(previousFullQuizAttempt.row)
  });
  const nextAction = buildQuizNextAction({
    chapterId: quiz.chapterId,
    result,
    attemptType: normalizedAttempt.attemptType
  });
  const quizSummary = buildQuizSummary({
    quiz,
    attemptType: normalizedAttempt.attemptType,
    result,
    xpAwarded,
    completedAt,
    nextAction
  });
  const eventType = EVENT_TYPE_BY_ATTEMPT[normalizedAttempt.attemptType];
  const applied = applyEventToProfile({
    profileRow: profileResult.row,
    eventType,
    chapterId: quiz.chapterId,
    eventDay: buildEventDay(completedAt),
    xpDelta: xpAwarded,
    payload: {
      quizSummary,
      nextAction
    }
  });
  const profilePatchPayload = buildProfilePatchFromApplied(applied);

  if (isGamificationRpcEnabled(env)) {
    const rpcResponse = await supabaseRpcRequest({
      config,
      fn: "record_chapter_quiz_attempt_atomic",
      body: {
        p_user_id: user.id,
        p_quiz_key: quiz.quizKey,
        p_chapter_id: quiz.chapterId,
        p_attempt_type: normalizedAttempt.attemptType,
        p_score: result.score,
        p_correct_count: result.correctCount,
        p_question_count: result.questionCount,
        p_xp_awarded: xpAwarded,
        p_answers: normalizedAttempt.answers,
        p_feedback: result.feedback,
        p_started_at: startedAt,
        p_completed_at: completedAt,
        p_profile_patch: profilePatchPayload,
        p_event_type: eventType,
        p_event_idempotency_key: `quiz:${normalizedAttempt.attemptType}:${quiz.quizKey}:${completedAt}`,
        p_event_payload: {
          quizSummary,
          nextAction
        }
      }
    });

    if (!rpcResponse.ok || !rpcResponse.payload?.profile) {
      return jsonResponse(rpcResponse.status || 500, {
        error: "Nao foi possivel consolidar o quiz por RPC.",
        details: rpcResponse.payload || "quiz_rpc_failed"
      });
    }

    return jsonResponse(200, buildQuizResponse({
      user,
      quiz,
      quizToken: requestBody.quizToken || "",
      persistedAttempt: {
        id: rpcResponse.payload.attempt_id || "",
        attempt_type: normalizedAttempt.attemptType,
        score: result.score,
        correct_count: result.correctCount,
        question_count: result.questionCount,
        xp_awarded: xpAwarded,
        started_at: startedAt,
        completed_at: completedAt
      },
      result,
      xpAwarded,
      nextAction,
      profileRow: rpcResponse.payload.profile
    }));
  }

  const persistedAttempt = await insertQuizAttemptRow({
    config,
    row: {
      user_id: user.id,
      quiz_key: quiz.quizKey,
      chapter_id: quiz.chapterId,
      attempt_type: normalizedAttempt.attemptType,
      score: result.score,
      correct_count: result.correctCount,
      question_count: result.questionCount,
      xp_awarded: xpAwarded,
      answers: normalizedAttempt.answers,
      feedback: result.feedback,
      started_at: startedAt,
      completed_at: completedAt
    }
  });

  if (!persistedAttempt.ok || !persistedAttempt.row) {
    return jsonResponse(persistedAttempt.status || 500, {
      error: "Nao foi possivel gravar a tentativa do quiz.",
      details: persistedAttempt.error || "quiz_attempt_insert_failed"
    });
  }

  const patchedProfile = await patchProfileRow({
    config,
    userId: user.id,
    patch: profilePatchPayload
  });

  if (!patchedProfile.ok || !patchedProfile.row) {
    return jsonResponse(patchedProfile.status || 500, {
      error: "A tentativa foi salva, mas o profile nao foi consolidado.",
      details: patchedProfile.error || "profile_patch_failed",
      partial: {
        attemptId: persistedAttempt.row.id
      }
    });
  }

  return jsonResponse(200, buildQuizResponse({
    user,
    quiz,
    quizToken: requestBody.quizToken || "",
    persistedAttempt: persistedAttempt.row,
    result,
    xpAwarded,
    nextAction,
    profileRow: patchedProfile.row
  }));
}
