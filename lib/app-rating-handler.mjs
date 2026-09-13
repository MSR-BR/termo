import { createHmac } from "node:crypto";
import {
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  parseJsonBody,
  readBearerToken,
  supabaseRestRequest
} from "./gamification-shared.mjs";

const MAX_FEEDBACK_LENGTH = 600;
const DEFAULT_ADMIN_EMAIL = "marioreis@id.uff.br";

function clampCount(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100000, number));
}

function normalizePagePath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path.slice(0, 240);
}

function normalizeFeedback(value) {
  const feedback = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return feedback ? feedback.slice(0, MAX_FEEDBACK_LENGTH) : null;
}

function accountRatingHash(userId, secret) {
  return createHmac("sha256", secret)
    .update("termo-app-rating-account-v2:")
    .update(String(userId || ""))
    .digest("hex");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function adminEmail(env) {
  return normalizeEmail(env.TERMO_RATING_ADMIN || DEFAULT_ADMIN_EMAIL);
}

async function authenticateUser(config, headers) {
  const accessToken = readBearerToken(headers);
  if (!accessToken) return null;
  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });
  return user?.id ? user : null;
}

async function authenticateAdmin(config, headers, env) {
  const user = await authenticateUser(config, headers);
  return user && normalizeEmail(user.email) === adminEmail(env) ? user : null;
}

function normalizeAdminRow(row = {}) {
  return {
    id: row.id,
    rating: Number(row.rating || 0),
    feedback: row.feedback || "",
    feedbackPrompt: row.feedback_prompt || "",
    pagePath: row.page_path || "",
    visitCount: Number(row.visit_count || 0),
    contentViewCount: Number(row.content_view_count || 0),
    firstSubmittedAt: row.first_submitted_at || "",
    updatedAt: row.updated_at || ""
  };
}

function summarizeRatings(rows) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalScore = 0;
  let withFeedback = 0;
  rows.forEach(function (row) {
    const rating = Number(row.rating || 0);
    if (distribution[rating] !== undefined) distribution[rating] += 1;
    totalScore += rating;
    if (row.feedback) withFeedback += 1;
  });
  return {
    total: rows.length,
    average: rows.length ? Number((totalScore / rows.length).toFixed(2)) : 0,
    withFeedback,
    distribution
  };
}

export async function handleAppRatingRequest({ method, headers = {}, query = {}, body, env = process.env }) {
  const config = ensureSupabaseServerConfig(env);
  if (!config) {
    return jsonResponse(500, { error: "Avaliacoes ainda nao configuradas." });
  }

  if (method === "GET") {
    if (String(query.scope || "").trim().toLowerCase() === "status") {
      const user = await authenticateUser(config, headers);
      if (!user) return jsonResponse(401, { error: "Entre para consultar sua avaliacao." });
      const ownHash = accountRatingHash(user.id, config.serviceRoleKey);
      const result = await supabaseRestRequest({
        config,
        path: "app_ratings",
        params: {
          select: "id",
          visitor_hash: `eq.${ownHash}`,
          limit: 1
        }
      });
      if (!result.ok) {
        return jsonResponse(result.status || 500, {
          error: "Nao foi possivel consultar sua avaliacao."
        });
      }
      const rows = Array.isArray(result.payload) ? result.payload : [];
      return jsonResponse(200, { ok: true, rated: rows.length > 0 });
    }

    const admin = await authenticateAdmin(config, headers, env);
    if (!admin) return jsonResponse(403, { error: "Area restrita ao administrador." });
    const result = await supabaseRestRequest({
      config,
      path: "app_ratings",
      params: {
        select: "id,rating,feedback,feedback_prompt,page_path,visit_count,content_view_count,first_submitted_at,updated_at",
        order: "updated_at.desc",
        limit: 500
      }
    });
    if (!result.ok) return jsonResponse(result.status || 500, { error: "Nao foi possivel carregar as avaliacoes." });
    const ratings = (Array.isArray(result.payload) ? result.payload : []).map(normalizeAdminRow);
    return jsonResponse(200, { summary: summarizeRatings(ratings), ratings });
  }

  if (method === "DELETE") {
    const admin = await authenticateAdmin(config, headers, env);
    if (!admin) return jsonResponse(403, { error: "Area restrita ao administrador." });
    const input = parseJsonBody(body);
    const id = Number.parseInt(input.id, 10);
    if (!Number.isInteger(id) || id < 1) return jsonResponse(400, { error: "Avaliacao invalida." });
    const result = await supabaseRestRequest({
      config,
      path: "app_ratings",
      method: "DELETE",
      params: { id: `eq.${id}` },
      prefer: "return=minimal"
    });
    if (!result.ok) return jsonResponse(result.status || 500, { error: "Nao foi possivel excluir a avaliacao." });
    return jsonResponse(200, { ok: true });
  }

  if (method !== "POST") {
    return jsonResponse(405, { error: "Use GET, POST ou DELETE." });
  }

  const input = parseJsonBody(body);
  const rating = Number.parseInt(input.rating, 10);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return jsonResponse(400, { error: "Escolha uma nota entre 1 e 5." });
  }

  const user = await authenticateUser(config, headers);
  if (!user) return jsonResponse(401, { error: "Entre para enviar sua avaliacao." });

  const feedback = normalizeFeedback(input.feedback);
  const feedbackPrompt = feedback
    ? (rating <= 3 ? "improvement" : "highlight")
    : null;
  const now = new Date().toISOString();
  const row = {
    visitor_hash: accountRatingHash(user.id, config.serviceRoleKey),
    rating,
    feedback,
    feedback_prompt: feedbackPrompt,
    page_path: normalizePagePath(input.pagePath),
    visit_count: clampCount(input.visitCount),
    content_view_count: clampCount(input.contentViewCount),
    updated_at: now
  };

  const result = await supabaseRestRequest({
    config,
    path: "app_ratings",
    method: "POST",
    params: { on_conflict: "visitor_hash" },
    prefer: "resolution=merge-duplicates,return=minimal",
    body: row
  });

  if (!result.ok) {
    return jsonResponse(result.status || 500, {
      error: "Nao foi possivel salvar sua avaliacao. Tente novamente."
    });
  }

  return jsonResponse(200, { ok: true });
}
