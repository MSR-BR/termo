import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  readBearerToken,
  supabaseRestRequest
} from "./gamification-shared.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const POLICY = JSON.parse(readFileSync(resolve(ROOT, "data/termo-evaluation-communication-policy-v1.json"), "utf8"));
const DEFAULT_ADMIN_EMAIL = "marioreis@id.uff.br";
const MAX_ROWS = 10000;
const MINIMUM_CELL_SIZE = Number(POLICY.privacy.minimumCellSize || 5);

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function clampDays(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(7, Math.min(90, parsed)) : 28;
}

function safeRows(response) {
  return response?.ok && Array.isArray(response.payload) ? response.payload : [];
}

function metric(value) {
  const count = Math.max(0, Number(value || 0));
  if (count > 0 && count < MINIMUM_CELL_SIZE) {
    return { value: null, display: `<${MINIMUM_CELL_SIZE}`, suppressed: true };
  }
  return { value: count, display: String(count), suppressed: false };
}

function average(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (numeric.length < MINIMUM_CELL_SIZE) return null;
  return Number((numeric.reduce(function (sum, value) { return sum + value; }, 0) / numeric.length).toFixed(1));
}

function countBy(rows, key) {
  const counts = {};
  rows.forEach(function (row) {
    const value = String(row?.[key] || "unknown");
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.fromEntries(Object.entries(counts).sort().map(function ([name, count]) {
    return [name, metric(count)];
  }));
}

function countWhere(rows, predicate) {
  return rows.filter(predicate).length;
}

async function resolveAdmin(config, headers, env) {
  const token = readBearerToken(headers);
  if (!token) return null;
  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken: token
  });
  const expected = normalizeEmail(env.TERMO_EVALUATION_ADMIN || env.TERMO_RATING_ADMIN || DEFAULT_ADMIN_EMAIL);
  return user?.id && normalizeEmail(user.email) === expected ? user : null;
}

async function readSource(config, path, params) {
  const response = await supabaseRestRequest({ config, path, params: { ...params, limit: MAX_ROWS } });
  return {
    ok: Boolean(response.ok),
    status: response.status,
    rows: safeRows(response)
  };
}

function fidelityForMechanic(mechanic, ledger, attempts, analytics) {
  const definitions = {
    section_completion: {
      action: countWhere(ledger, function (row) { return row.shared_event_type === "section_completed"; }),
      reward: countWhere(ledger, function (row) { return row.shared_event_type === "section_completed" && row.reward_eligible === true && Number(row.xp_delta || 0) > 0; })
    },
    chapter_assessment: {
      exposure: countWhere(analytics, function (row) { return row.event_name === "quiz_start"; }),
      action: countWhere(attempts, function (row) { return row.attempt_type === "full_quiz"; }),
      reward: countWhere(ledger, function (row) { return row.shared_event_type === "assessment_completed" && row.reward_eligible === true; })
    },
    guided_review: {
      action: countWhere(attempts, function (row) { return row.attempt_type === "guided_review"; }),
      reward: countWhere(ledger, function (row) { return row.shared_event_type === "assessment_reviewed" && row.reward_eligible === true; })
    },
    focused_retry: {
      action: countWhere(attempts, function (row) { return row.attempt_type === "focused_retry"; }),
      reward: countWhere(ledger, function (row) { return row.shared_event_type === "assessment_retry_completed" && row.reward_eligible === true; })
    },
    daily_challenge: {
      action: countWhere(attempts, function (row) { return row.attempt_type === "daily_challenge"; }),
      reward: countWhere(ledger, function (row) { return row.shared_event_type === "daily_challenge_completed" && row.reward_eligible === true; })
    },
    simulator: {
      exposure: countWhere(analytics, function (row) { return row.event_name === "simulator_open_click"; }),
      action: countWhere(analytics, function (row) { return row.event_name === "simulator_start"; })
    }
  };
  const counts = definitions[mechanic.id] || {};
  return {
    id: mechanic.id,
    label: mechanic.label,
    stages: Object.fromEntries(POLICY.fidelityStages.map(function (stage) {
      const definition = mechanic[stage] || { status: "unavailable", source: null };
      return [stage, {
        status: definition.status,
        source: definition.source,
        count: Object.hasOwn(counts, stage) ? metric(counts[stage]) : null
      }];
    }))
  };
}

export async function handleLearningEvaluationReportRequest({
  method,
  headers = {},
  query = {},
  env = process.env,
  now = function () { return new Date(); }
}) {
  if (method !== "GET") return jsonResponse(405, { error: "Use GET." });
  const config = ensureSupabaseServerConfig(env);
  if (!config) return jsonResponse(500, { error: "A avaliação ainda não está configurada no servidor." });
  const admin = await resolveAdmin(config, headers, env);
  if (!admin) return jsonResponse(403, { error: "Área restrita ao administrador do TERMO." });

  const windowDays = clampDays(query.days);
  const generatedAt = now();
  const since = new Date(generatedAt.getTime() - windowDays * 86400000).toISOString();

  const [ledgerSource, attemptSource, analyticsSource, ratingSource, preferenceSource, deliverySource] = await Promise.all([
    readSource(config, "gamification_event_log", {
      select: "event_type,shared_event_type,evidence_class,reward_eligible,mastery_eligible,xp_delta,policy_version,received_at,concept_ids,source_ids",
      received_at: `gte.${since}`,
      order: "received_at.asc"
    }),
    readSource(config, "chapter_quiz_attempts", {
      select: "attempt_type,score,question_count,completed_at,feedback",
      completed_at: `gte.${since}`,
      order: "completed_at.asc"
    }),
    readSource(config, "app_analytics_events", {
      select: "event_name,created_at",
      created_at: `gte.${since}`,
      order: "created_at.asc"
    }),
    readSource(config, "app_ratings", {
      select: "rating,updated_at",
      updated_at: `gte.${since}`,
      order: "updated_at.asc"
    }),
    readSource(config, "user_legal_preferences", {
      select: "email_updates_opted_in,email_updates_opted_in_at,email_updates_opted_out_at,email_updates_paused_until"
    }),
    readSource(config, "email_recipient_deliveries", {
      select: "delivery_kind,status,sent_at",
      sent_at: `gte.${since}`,
      order: "sent_at.asc"
    })
  ]);

  const ledger = ledgerSource.rows;
  const attempts = attemptSource.rows;
  const analytics = analyticsSource.rows;
  const ratings = ratingSource.rows;
  const preferences = preferenceSource.rows;
  const deliveries = deliverySource.rows;
  const nowMs = generatedAt.getTime();
  const independentRetrievals = countWhere(ledger, function (row) { return row.evidence_class === "independent_retrieval"; });
  const missingEvidence = countWhere(ledger, function (row) { return !row.evidence_class; });
  const missingConcepts = countWhere(ledger, function (row) { return !Array.isArray(row.concept_ids) || row.concept_ids.length === 0; });
  const missingSources = countWhere(ledger, function (row) { return !Array.isArray(row.source_ids) || row.source_ids.length === 0; });

  return jsonResponse(200, {
    schemaVersion: 1,
    policyVersion: POLICY.version,
    generatedAt: generatedAt.toISOString(),
    window: { days: windowDays, since },
    privacy: {
      aggregatedOnly: true,
      minimumCellSize: MINIMUM_CELL_SIZE,
      individualRowsReturned: false
    },
    learning: {
      exactOutcome: "Desempenho observado em tentativas e recuperações registradas; não é uma estimativa causal de ganho de aprendizagem.",
      attempts: metric(attempts.length),
      attemptsByMode: countBy(attempts, "attempt_type"),
      averageObservedScore: average(attempts.map(function (row) { return row.score; })),
      independentRetrievals: metric(independentRetrievals),
      baseline: POLICY.researchPlan.baseline,
      delayedRetention: POLICY.researchPlan.retention,
      changedFormTransfer: POLICY.researchPlan.transfer,
      claimGate: POLICY.researchPlan.claimGate
    },
    behavior: {
      exactOutcome: "Eventos de uso e navegação; não medem aprendizagem ou domínio.",
      events: metric(analytics.length),
      eventsByName: countBy(analytics, "event_name")
    },
    experience: {
      exactOutcome: "Satisfação declarada em avaliações opcionais; não mede eficácia pedagógica.",
      ratings: metric(ratings.length),
      averageRating: average(ratings.map(function (row) { return row.rating; }))
    },
    fidelity: {
      exactOutcome: "Cobertura observável das etapas de cada mecânica; lacunas aparecem como indisponíveis, sem inferência.",
      mechanics: POLICY.mechanics.map(function (mechanic) {
        return fidelityForMechanic(mechanic, ledger, attempts, analytics);
      })
    },
    equitySafety: {
      exactOutcome: "Sinais agregados de atrito, ausência, opt-out e comunicação; não demonstra ausência de viés ou dano.",
      optedIn: metric(countWhere(preferences, function (row) { return row.email_updates_opted_in === true; })),
      paused: metric(countWhere(preferences, function (row) {
        const until = new Date(row.email_updates_paused_until || "");
        return !Number.isNaN(until.getTime()) && until.getTime() > nowMs;
      })),
      optedOut: metric(countWhere(preferences, function (row) { return Boolean(row.email_updates_opted_out_at); })),
      deliveriesByStatus: countBy(deliveries, "status")
    },
    dataQuality: {
      sources: {
        learningLedger: { ok: ledgerSource.ok, rows: metric(ledger.length), truncated: ledger.length >= MAX_ROWS },
        assessmentAttempts: { ok: attemptSource.ok, rows: metric(attempts.length), truncated: attempts.length >= MAX_ROWS },
        behaviorTelemetry: { ok: analyticsSource.ok, rows: metric(analytics.length), truncated: analytics.length >= MAX_ROWS },
        experience: { ok: ratingSource.ok, rows: metric(ratings.length), truncated: ratings.length >= MAX_ROWS },
        communicationPreferences: { ok: preferenceSource.ok, rows: metric(preferences.length), truncated: preferences.length >= MAX_ROWS },
        deliveryAudit: { ok: deliverySource.ok, rows: metric(deliveries.length), truncated: deliveries.length >= MAX_ROWS }
      },
      missingLedgerEvidenceClass: metric(missingEvidence),
      missingLedgerConceptIds: metric(missingConcepts),
      missingLedgerSourceIds: metric(missingSources),
      limitations: [
        "Não existe baseline comparável coletado nesta versão.",
        "Retenção tardia e transferência em forma alterada ainda não são identificáveis automaticamente.",
        "Supressões por idempotência anteriores não possuem contagem histórica persistida.",
        "Contagens pequenas são suprimidas para reduzir risco de identificação indireta."
      ]
    }
  });
}
