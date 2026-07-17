import {
  ensureProfileRow,
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  fetchItemProgressRows,
  fetchQuizAttemptRows,
  jsonResponse,
  mapProfileRowToJourneyProfile,
  readBearerToken
} from "./gamification-shared.mjs";

export async function handleGamificationProfileRequest({
  method,
  headers = {},
  env = process.env
}) {
  if (!["GET", "HEAD"].includes(method || "GET")) {
    return jsonResponse(405, { error: "Use GET." });
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
      error: "Entre com Google para abrir sua jornada."
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

  const profileResult = await ensureProfileRow({
    config,
    userId: user.id
  });

  if (!profileResult.ok || !profileResult.row) {
    return jsonResponse(profileResult.status || 500, {
      error: "Nao foi possivel carregar sua jornada.",
      details: profileResult.error || "profile_load_failed"
    });
  }

  const attemptsResult = await fetchQuizAttemptRows({
    config,
    userId: user.id,
    attemptType: "full_quiz",
    limit: 24
  });

  if (!attemptsResult.ok) {
    return jsonResponse(attemptsResult.status || 500, {
      error: "Nao foi possivel carregar seu progresso de simulados.",
      details: attemptsResult.error || "quiz_attempts_load_failed"
    });
  }

  const itemProgressResult = await fetchItemProgressRows({
    config,
    userId: user.id,
    limit: 50
  });

  if (!itemProgressResult.ok) {
    return jsonResponse(itemProgressResult.status || 500, {
      error: "Nao foi possivel carregar seus itens estudados.",
      details: itemProgressResult.error || "item_progress_load_failed"
    });
  }

  return jsonResponse(200, mapProfileRowToJourneyProfile(user, profileResult.row, {
    quizAttemptRows: attemptsResult.rows,
    itemProgressRows: itemProgressResult.rows
  }));
}
