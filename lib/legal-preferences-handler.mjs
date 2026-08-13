import {
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  parseJsonBody,
  readBearerToken,
  supabaseRestRequest
} from "./gamification-shared.mjs";

export const TERMS_VERSION = "2026-08-13";
export const PRIVACY_VERSION = "2026-08-13";

function normalizeRow(row = {}) {
  return {
    termsVersion: row.terms_version || "",
    termsAcceptedAt: row.terms_accepted_at || "",
    privacyVersion: row.privacy_version || "",
    privacyAcknowledgedAt: row.privacy_acknowledged_at || "",
    emailUpdatesOptedIn: row.email_updates_opted_in !== false,
    emailUpdatesOptedInAt: row.email_updates_opted_in_at || "",
    emailUpdatesOptedOutAt: row.email_updates_opted_out_at || ""
  };
}

async function resolveUser(headers, env) {
  const config = ensureSupabaseServerConfig(env);
  const accessToken = readBearerToken(headers);
  if (!config || !accessToken) return { config, user: null };
  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });
  return { config, user };
}

async function readRow(config, userId) {
  return supabaseRestRequest({
    config,
    path: "user_legal_preferences",
    params: { select: "*", user_id: `eq.${userId}`, limit: 1 }
  });
}

export async function handleLegalPreferencesRequest({ method, headers = {}, body, env = process.env }) {
  if (!["GET", "PUT"].includes(method || "GET")) return jsonResponse(405, { error: "Use GET ou PUT." });

  const { config, user } = await resolveUser(headers, env);
  if (!config) return jsonResponse(500, { error: "Preferencias ainda nao configuradas." });
  if (!user?.id) return jsonResponse(401, { error: "Entre com Google para acessar suas preferencias." });

  if (method === "GET") {
    const result = await readRow(config, user.id);
    if (!result.ok) return jsonResponse(result.status || 500, { error: "Nao foi possivel carregar suas preferencias." });
    return jsonResponse(200, { ...normalizeRow(Array.isArray(result.payload) ? result.payload[0] : result.payload), termsCurrentVersion: TERMS_VERSION, privacyCurrentVersion: PRIVACY_VERSION });
  }

  const input = parseJsonBody(body);
  const now = new Date().toISOString();
  const acceptDocuments = input.acceptDocuments === true;
  const emailUpdatesOptedIn = input.emailUpdatesOptedIn;
  if (!acceptDocuments && typeof emailUpdatesOptedIn !== "boolean") {
    return jsonResponse(400, { error: "Informe uma alteracao valida." });
  }

  const patch = { user_id: user.id };
  if (acceptDocuments) {
    patch.terms_version = TERMS_VERSION;
    patch.terms_accepted_at = now;
    patch.privacy_version = PRIVACY_VERSION;
    patch.privacy_acknowledged_at = now;
  }
  if (typeof emailUpdatesOptedIn === "boolean") {
    patch.email_updates_opted_in = emailUpdatesOptedIn;
    patch.email_updates_opted_in_at = emailUpdatesOptedIn ? now : null;
    patch.email_updates_opted_out_at = emailUpdatesOptedIn ? null : now;
  }

  const result = await supabaseRestRequest({
    config,
    path: "user_legal_preferences",
    method: "POST",
    params: { on_conflict: "user_id" },
    prefer: "resolution=merge-duplicates,return=representation",
    body: patch
  });
  if (!result.ok) return jsonResponse(result.status || 500, { error: "Nao foi possivel salvar suas preferencias." });
  const row = Array.isArray(result.payload) ? result.payload[0] : result.payload;
  return jsonResponse(200, { ...normalizeRow(row), termsCurrentVersion: TERMS_VERSION, privacyCurrentVersion: PRIVACY_VERSION });
}
