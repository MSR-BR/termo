const DEFAULT_ENABLED_QUIZ_CHAPTER_IDS = ["02", "04"];
const DEFAULT_PREFERRED_SEND_TIME = "07:10";
const XP_PER_LEVEL = 100;
export const CHAPTER_MASTERY_SCORE = 80;
export const CHAPTER_EXCELLENCE_SCORE = 100;
const TRUE_ENV_VALUES = new Set(["1", "true", "yes", "on"]);
const DEFAULT_NEXT_ACTION = {
  type: "choose_chapter",
  label: "Escolher primeiro capítulo",
  href: "index.html?view=chapters",
  reason: "Sua jornada começa zerada. Escolha um capítulo, marque itens estudados ou faça um simulado para gerar recomendações."
};

export function jsonResponse(status, body) {
  return { status, body };
}

export function getSupabaseConfig(env = process.env) {
  return {
    supabaseUrl: String(env.PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""),
    publishableKey: String(env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""),
    serviceRoleKey: String(
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_SECRET_KEY ||
      env.SUPABASE_SERVICE_KEY ||
      ""
    )
  };
}

export function readBearerToken(headers = {}) {
  return String(headers.authorization || headers.Authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

export async function fetchAuthenticatedUser({
  supabaseUrl,
  publishableKey,
  accessToken
}) {
  if (!supabaseUrl || !publishableKey || !accessToken) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function ensureSupabaseConfig(env = process.env) {
  const config = getSupabaseConfig(env);
  return config.supabaseUrl && config.publishableKey ? config : null;
}

export function ensureSupabaseServerConfig(env = process.env) {
  const config = getSupabaseConfig(env);
  return config.supabaseUrl && config.publishableKey && config.serviceRoleKey
    ? config
    : null;
}

export function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body;
  return {};
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeIsoTimestamp(value) {
  if (!isNonEmptyString(value)) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : fallback;
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

export function levelFromXp(xpTotal) {
  return Math.max(1, Math.floor(Math.max(0, Number(xpTotal || 0)) / XP_PER_LEVEL) + 1);
}

export function levelProgressPercent(xpTotal) {
  const xp = Math.max(0, Number(xpTotal || 0));
  return Math.max(0, Math.min(100, Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)));
}

export function buildDefaultProfileRow(userId) {
  return {
    user_id: userId,
    xp_total: 0,
    level: 1,
    current_streak: 0,
    best_streak: 0,
    last_active_on: null,
    studied_items_count: 0,
    chapters_mastered_count: 0,
    last_quiz_summary: {},
    recent_badges_json: [],
    active_missions_json: [],
    next_action_json: { ...DEFAULT_NEXT_ACTION },
    preferences_json: {
      dailyChallengeEmailEnabled: false,
      preferredSendTime: DEFAULT_PREFERRED_SEND_TIME
    }
  };
}

function buildRestUrl({ supabaseUrl, path, params = {} }) {
  const url = new URL(`${supabaseUrl}/rest/v1/${path}`);
  Object.entries(params).forEach(function ([key, value]) {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function readResponsePayload(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function supabaseRestRequest({
  config,
  path,
  method = "GET",
  params = {},
  body,
  prefer = "",
  headers = {}
}) {
  const response = await fetch(buildRestUrl({
    supabaseUrl: config.supabaseUrl,
    path,
    params
  }), {
    method,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const payload = await readResponsePayload(response);

  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

export async function supabaseRpcRequest({
  config,
  fn,
  body = {},
  headers = {}
}) {
  return supabaseRestRequest({
    config,
    path: `rpc/${fn}`,
    method: "POST",
    body,
    headers
  });
}

export function isGamificationRpcEnabled(env = process.env) {
  return TRUE_ENV_VALUES.has(String(env.TERMO_GAMIFICATION_RPC_MODE || "").trim().toLowerCase());
}

function firstRow(payload) {
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload && typeof payload === "object") return payload;
  return null;
}

export async function fetchProfileRow({ config, userId }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_profiles",
    params: {
      select: "*",
      user_id: `eq.${userId}`,
      limit: 1
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    row: firstRow(response.payload)
  };
}

export async function upsertProfileRow({ config, row }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_profiles",
    method: "POST",
    params: {
      on_conflict: "user_id"
    },
    prefer: "resolution=merge-duplicates,return=representation",
    body: row
  });

  return {
    ok: response.ok,
    status: response.status,
    row: firstRow(response.payload),
    error: response.ok ? null : response.payload
  };
}

export async function patchProfileRow({ config, userId, patch }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_profiles",
    method: "PATCH",
    params: {
      user_id: `eq.${userId}`,
      select: "*"
    },
    prefer: "return=representation",
    body: patch
  });

  return {
    ok: response.ok,
    status: response.status,
    row: firstRow(response.payload),
    error: response.ok ? null : response.payload
  };
}

export async function ensureProfileRow({ config, userId }) {
  const existing = await fetchProfileRow({ config, userId });
  if (!existing.ok) return existing;
  if (existing.row) return existing;

  return upsertProfileRow({
    config,
    row: buildDefaultProfileRow(userId)
  });
}

export async function fetchEventByIdempotencyKey({ config, idempotencyKey }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_event_log",
    params: {
      select: "*",
      idempotency_key: `eq.${idempotencyKey}`,
      limit: 1
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    row: firstRow(response.payload)
  };
}

export async function insertEventLogRow({ config, row }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_event_log",
    method: "POST",
    prefer: "return=representation",
    body: row
  });

  return {
    ok: response.ok,
    status: response.status,
    row: firstRow(response.payload),
    error: response.ok ? null : response.payload
  };
}

export async function fetchItemProgressRow({ config, userId, itemKey }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_item_progress",
    params: {
      select: "*",
      user_id: `eq.${userId}`,
      item_key: `eq.${itemKey}`,
      limit: 1
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    row: firstRow(response.payload)
  };
}

export async function fetchItemProgressRows({
  config,
  userId,
  limit = 50
}) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_item_progress",
    params: {
      select: "chapter_id,item_id,item_key,status,completed_at,last_reviewed_at",
      user_id: `eq.${userId}`,
      order: "completed_at.desc",
      limit: Math.max(1, Math.min(100, Number(limit || 50)))
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    rows: Array.isArray(response.payload) ? response.payload : []
  };
}

export async function upsertItemProgressRow({ config, row }) {
  const response = await supabaseRestRequest({
    config,
    path: "gamification_item_progress",
    method: "POST",
    params: {
      on_conflict: "user_id,item_key"
    },
    prefer: "resolution=merge-duplicates,return=representation",
    body: row
  });

  return {
    ok: response.ok,
    status: response.status,
    row: firstRow(response.payload),
    error: response.ok ? null : response.payload
  };
}

export async function fetchLatestQuizAttemptRow({
  config,
  userId,
  quizKey,
  attemptType = ""
}) {
  const response = await supabaseRestRequest({
    config,
    path: "chapter_quiz_attempts",
    params: {
      select: "*",
      user_id: `eq.${userId}`,
      quiz_key: `eq.${quizKey}`,
      ...(attemptType ? { attempt_type: `eq.${attemptType}` } : {}),
      order: "completed_at.desc",
      limit: 1
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    row: firstRow(response.payload)
  };
}

export async function fetchQuizAttemptRows({
  config,
  userId,
  attemptType = "full_quiz",
  limit = 24
}) {
  const response = await supabaseRestRequest({
    config,
    path: "chapter_quiz_attempts",
    params: {
      select: "quiz_key,chapter_id,attempt_type,score,correct_count,question_count,xp_awarded,completed_at",
      user_id: `eq.${userId}`,
      ...(attemptType ? { attempt_type: `eq.${attemptType}` } : {}),
      order: "completed_at.desc",
      limit: Math.max(1, Math.min(50, Number(limit || 24)))
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.payload
    };
  }

  return {
    ok: true,
    rows: Array.isArray(response.payload) ? response.payload : []
  };
}

export async function insertQuizAttemptRow({ config, row }) {
  const response = await supabaseRestRequest({
    config,
    path: "chapter_quiz_attempts",
    method: "POST",
    prefer: "return=representation",
    body: row
  });

  return {
    ok: response.ok,
    status: response.status,
    row: firstRow(response.payload),
    error: response.ok ? null : response.payload
  };
}

export function buildProfilePatchFromApplied(applied) {
  const next = applied?.next || {};

  return {
    xp_total: Math.max(0, Number(next.xp_total || 0)),
    level: Math.max(1, Number(next.level || levelFromXp(next.xp_total || 0))),
    current_streak: Math.max(0, Number(next.current_streak || 0)),
    best_streak: Math.max(0, Number(next.best_streak || 0)),
    last_active_on: next.last_active_on || null,
    studied_items_count: Math.max(0, Number(next.studied_items_count || 0)),
    chapters_mastered_count: Math.max(0, Number(next.chapters_mastered_count || 0)),
    last_quiz_summary: normalizeObject(next.last_quiz_summary, {}),
    recent_badges_json: normalizeArray(next.recent_badges_json, []),
    active_missions_json: normalizeArray(next.active_missions_json, []),
    next_action_json: normalizeObject(next.next_action_json, { ...DEFAULT_NEXT_ACTION }),
    preferences_json: normalizeObject(next.preferences_json, {
      dailyChallengeEmailEnabled: false,
      preferredSendTime: DEFAULT_PREFERRED_SEND_TIME
    })
  };
}

function buildChapterProgressFromAttempts(attemptRows = []) {
  const byChapter = new Map();

  attemptRows.forEach(function (attempt) {
    const chapterId = String(attempt.chapter_id || "").trim();
    if (!chapterId) return;

    const score = Math.max(0, Number(attempt.score || 0));
    const existing = byChapter.get(chapterId) || {
      chapterId,
      quizKey: String(attempt.quiz_key || ""),
      attemptsCount: 0,
      bestScore: 0,
      latestScore: 0,
      latestCompletedAt: "",
      correctCount: 0,
      questionCount: 0,
      xpAwarded: 0,
      mastered: false,
      excellent: false,
      status: "not_started",
      statusLabel: "Simulado pendente",
      statusHint: "Abra o simulado para medir consolidacao."
    };

    existing.attemptsCount += 1;

    if (!existing.latestCompletedAt) {
      existing.latestScore = score;
      existing.latestCompletedAt = attempt.completed_at || "";
      existing.correctCount = Math.max(0, Number(attempt.correct_count || 0));
      existing.questionCount = Math.max(0, Number(attempt.question_count || 0));
      existing.xpAwarded = Math.max(0, Number(attempt.xp_awarded || 0));
    }

    existing.bestScore = Math.max(existing.bestScore, score);
    existing.mastered = existing.bestScore >= CHAPTER_MASTERY_SCORE;
    existing.excellent = existing.bestScore >= CHAPTER_EXCELLENCE_SCORE;
    existing.status = existing.mastered ? "mastered" : "review";
    existing.statusLabel = existing.mastered ? "Dominado" : "Revisar antes de avancar";
    existing.statusHint = existing.mastered
      ? "Aproveitamento de 80% ou mais no simulado."
      : "Faltou chegar a 80%; revise o ultimo erro antes de tentar de novo.";

    byChapter.set(chapterId, existing);
  });

  return Array.from(byChapter.values());
}

function normalizeStudyItemRows(itemRows = []) {
  return itemRows.map(function (row) {
    const chapterId = String(row.chapter_id || "").trim().padStart(2, "0");
    const itemId = String(row.item_id || "").trim();
    if (!chapterId || !itemId) return null;

    return {
      chapterId,
      itemId,
      itemKey: String(row.item_key || `${chapterId}:${itemId}`).trim(),
      status: String(row.status || "studied").trim() || "studied",
      completedAt: row.completed_at || "",
      lastReviewedAt: row.last_reviewed_at || ""
    };
  }).filter(Boolean);
}

function mergeStudyProgressIntoChapters(chapterProgress = [], studiedItems = []) {
  const byChapter = new Map();

  chapterProgress.forEach(function (item) {
    const chapterId = String(item.chapterId || item.chapter_id || "").trim().padStart(2, "0");
    if (!chapterId) return;
    byChapter.set(chapterId, {
      ...item,
      chapterId,
      studiedItems: Math.max(0, Number(item.studiedItems || item.studied_items || 0)),
      recentStudiedItems: normalizeArray(item.recentStudiedItems, [])
    });
  });

  studiedItems.forEach(function (item) {
    const chapterId = item.chapterId;
    const existing = byChapter.get(chapterId) || {
      chapterId,
      quizKey: "",
      attemptsCount: 0,
      bestScore: 0,
      latestScore: 0,
      latestCompletedAt: "",
      correctCount: 0,
      questionCount: 0,
      xpAwarded: 0,
      mastered: false,
      excellent: false,
      status: "study_started",
      statusLabel: "Estudo iniciado",
      statusHint: "Itens marcados como estudados, sem simulado consolidado ainda.",
      studiedItems: 0,
      recentStudiedItems: []
    };

    existing.studiedItems = Math.max(0, Number(existing.studiedItems || 0)) + 1;
    existing.recentStudiedItems = normalizeArray(existing.recentStudiedItems, []).concat(item).slice(0, 6);

    if (!existing.mastered && existing.status === "not_started") {
      existing.status = "study_started";
      existing.statusLabel = "Estudo iniciado";
      existing.statusHint = "Ha itens marcados como estudados antes do simulado.";
    }

    byChapter.set(chapterId, existing);
  });

  return Array.from(byChapter.values());
}

export function mapProfileRowToJourneyProfile(user = {}, row = {}, options = {}) {
  const studiedItemRows = normalizeStudyItemRows(options.itemProgressRows || []);
  const chapterProgress = mergeStudyProgressIntoChapters(
    buildChapterProgressFromAttempts(options.quizAttemptRows || []),
    studiedItemRows
  );
  const masteredFromAttempts = chapterProgress.filter(function (item) {
    return item.mastered;
  }).length;
  const summary = {
    xpTotal: Math.max(0, Number(row.xp_total || 0)),
    level: Math.max(1, Number(row.level || levelFromXp(row.xp_total || 0))),
    levelProgressPercent: levelProgressPercent(row.xp_total || 0),
    currentStreak: Math.max(0, Number(row.current_streak || 0)),
    bestStreak: Math.max(0, Number(row.best_streak || 0)),
    studiedItemsCount: Math.max(0, Number(row.studied_items_count || 0)),
    chaptersMasteredCount: Math.max(masteredFromAttempts, Number(row.chapters_mastered_count || 0))
  };

  const nextAction = normalizeObject(row.next_action_json, { ...DEFAULT_NEXT_ACTION });
  const preferences = normalizeObject(row.preferences_json, {
    dailyChallengeEmailEnabled: false,
    preferredSendTime: DEFAULT_PREFERRED_SEND_TIME
  });
  const lastQuizSummary = normalizeObject(row.last_quiz_summary, {});
  const hasLastQuiz = isNonEmptyString(lastQuizSummary.chapterId || "") || isNonEmptyString(lastQuizSummary.chapterTitle || "");

  return {
    ok: true,
    contractVersion: "phase-1c-live",
    viewer: {
      isAuthenticated: true,
      userId: user.id || "",
      email: user.email || "",
      entryView: "journey",
      defaultSection: "overview"
    },
    summary,
    nextAction,
    missions: normalizeArray(row.active_missions_json, []),
    recentBadges: normalizeArray(row.recent_badges_json, []),
    lastQuizResult: hasLastQuiz ? lastQuizSummary : null,
    chapterProgress,
    recentStudiedItems: studiedItemRows.slice(0, 12),
    preferences,
    featureFlags: {
      showJourney: true,
      showDailyChallengeEmail: false,
      enabledQuizChapterIds: DEFAULT_ENABLED_QUIZ_CHAPTER_IDS,
      masteryScore: CHAPTER_MASTERY_SCORE,
      excellenceScore: CHAPTER_EXCELLENCE_SCORE
    },
    source: {
      mode: "live_profile",
      details: "Dados lidos de gamification_profiles com snapshot consolidado."
    }
  };
}

export function buildEventDay(occurredAtIso = "") {
  return (occurredAtIso || new Date().toISOString()).slice(0, 10);
}

function parseDayString(value) {
  if (!isNonEmptyString(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDays(leftDay, rightDay) {
  const left = parseDayString(leftDay);
  const right = parseDayString(rightDay);
  if (!left || !right) return null;
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

function mergeUniqueBadges(existingBadges, unlockedBadges) {
  const seen = new Set();
  const merged = [];

  existingBadges.concat(unlockedBadges).forEach(function (badge) {
    const candidate = normalizeObject(badge, null);
    if (!candidate?.key || seen.has(candidate.key)) return;
    seen.add(candidate.key);
    merged.push(candidate);
  });

  return merged.slice(0, 8);
}

function buildUnlockedBadges({
  eventType,
  chapterId,
  previousProfile,
  nextProfile
}) {
  const unlocked = [];
  const existingKeys = new Set(normalizeArray(previousProfile.recent_badges_json, []).map(function (badge) {
    return badge?.key || "";
  }));

  function maybeUnlock(badge) {
    if (!badge?.key || existingKeys.has(badge.key)) return;
    existingKeys.add(badge.key);
    unlocked.push(badge);
  }

  if (eventType === "study_item_complete" && Number(previousProfile.studied_items_count || 0) === 0) {
    maybeUnlock({
      key: "primeiro_item",
      title: "Primeiro item concluido",
      description: "Voce iniciou sua trilha oficial de estudo.",
      awardedAt: new Date().toISOString()
    });
  }

  if (Number(nextProfile.current_streak || 0) >= 3) {
    maybeUnlock({
      key: "sequencia_3_dias",
      title: "Sequencia de 3 dias",
      description: "Constancia inicial consolidada com tres retornos seguidos.",
      awardedAt: new Date().toISOString()
    });
  }

  if (Number(nextProfile.current_streak || 0) >= 7) {
    maybeUnlock({
      key: "sequencia_7_dias",
      title: "Sequencia de 7 dias",
      description: "Uma semana inteira de ritmo consistente.",
      awardedAt: new Date().toISOString()
    });
  }

  if (eventType === "chapter_quiz_completed") {
    maybeUnlock({
      key: "primeiro_simulado",
      title: "Primeiro simulado concluido",
      description: "Voce concluiu o primeiro simulado oficial da jornada.",
      awardedAt: new Date().toISOString()
    });
  }

  if (
    (
      eventType === "chapter_mastery_completed" ||
      (eventType === "chapter_quiz_completed" && nextProfile.last_quiz_summary?.isMastered)
    ) &&
    isNonEmptyString(chapterId)
  ) {
    maybeUnlock({
      key: `capitulo_${chapterId}_domado`,
      title: `Capitulo ${chapterId} dominado`,
      description: "Voce chegou a pelo menos 80% no simulado do capitulo.",
      awardedAt: new Date().toISOString()
    });
  }

  if (eventType === "chapter_quiz_completed" && nextProfile.last_quiz_summary?.isExcellent && isNonEmptyString(chapterId)) {
    maybeUnlock({
      key: `capitulo_${chapterId}_excelencia`,
      title: `Capitulo ${chapterId} com excelencia`,
      description: "Voce acertou 100% do simulado. Excelencia vira conquista, nao trava de progresso.",
      awardedAt: new Date().toISOString()
    });
  }

  return unlocked;
}

export function applyEventToProfile({
  profileRow,
  eventType,
  chapterId,
  eventDay,
  xpDelta,
  payload = {}
}) {
  const previous = {
    ...buildDefaultProfileRow(profileRow.user_id || ""),
    ...profileRow,
    recent_badges_json: normalizeArray(profileRow.recent_badges_json, []),
    active_missions_json: normalizeArray(profileRow.active_missions_json, []),
    next_action_json: normalizeObject(profileRow.next_action_json, { ...DEFAULT_NEXT_ACTION }),
    preferences_json: normalizeObject(profileRow.preferences_json, {
      dailyChallengeEmailEnabled: false,
      preferredSendTime: DEFAULT_PREFERRED_SEND_TIME
    }),
    last_quiz_summary: normalizeObject(profileRow.last_quiz_summary, {})
  };

  const next = {
    ...previous
  };

  const dayDiff = diffDays(previous.last_active_on, eventDay);
  if (!previous.last_active_on) {
    next.current_streak = 1;
    next.best_streak = Math.max(Number(previous.best_streak || 0), 1);
    next.last_active_on = eventDay;
  } else if (dayDiff === 1) {
    next.current_streak = Number(previous.current_streak || 0) + 1;
    next.best_streak = Math.max(Number(previous.best_streak || 0), next.current_streak);
    next.last_active_on = eventDay;
  } else if (dayDiff !== null && dayDiff > 1) {
    next.current_streak = 1;
    next.best_streak = Math.max(Number(previous.best_streak || 0), 1);
    next.last_active_on = eventDay;
  } else if (dayDiff === 0) {
    next.current_streak = Number(previous.current_streak || 0);
    next.best_streak = Math.max(Number(previous.best_streak || 0), Number(previous.current_streak || 0));
    next.last_active_on = eventDay;
  }

  next.xp_total = Math.max(0, Number(previous.xp_total || 0) + Number(xpDelta || 0));
  next.level = levelFromXp(next.xp_total);

  if (eventType === "study_item_complete") {
    next.studied_items_count = Math.max(0, Number(previous.studied_items_count || 0) + 1);
  }

  if (eventType === "chapter_mastery_completed") {
    next.chapters_mastered_count = Math.max(0, Number(previous.chapters_mastered_count || 0) + 1);
  }

  if (eventType === "chapter_quiz_completed" && payload.quizSummary && typeof payload.quizSummary === "object") {
    next.last_quiz_summary = payload.quizSummary;
    const masteryBadgeKey = `capitulo_${payload.quizSummary.chapterId || chapterId}_domado`;
    const existingBadgeKeys = new Set(previous.recent_badges_json.map(function (badge) {
      return badge?.key || "";
    }));
    if (payload.quizSummary.isMastered && !existingBadgeKeys.has(masteryBadgeKey)) {
      next.chapters_mastered_count = Math.max(0, Number(previous.chapters_mastered_count || 0) + 1);
    }
  }

  if (payload.nextAction && typeof payload.nextAction === "object") {
    next.next_action_json = payload.nextAction;
  } else if (eventType === "study_item_complete" && isNonEmptyString(chapterId)) {
    next.next_action_json = {
      type: "chapter_quiz",
      label: `Abrir simulado de Capitulo ${chapterId}`,
      href: `index.html?view=journey&section=quiz&chapter=${chapterId}`,
      reason: "novo item concluido; vale testar consolidacao"
    };
  }

  const unlockedBadges = buildUnlockedBadges({
    eventType,
    chapterId,
    previousProfile: previous,
    nextProfile: next
  });
  next.recent_badges_json = mergeUniqueBadges(previous.recent_badges_json, unlockedBadges);

  return {
    previous,
    next,
    unlockedBadges
  };
}
