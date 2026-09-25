import {
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  parseJsonBody,
  readBearerToken,
  supabaseRestRequest
} from "./gamification-shared.mjs";
import { PRIVACY_VERSION, TERMS_VERSION } from "./legal-preferences-handler.mjs";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_ADMIN_EMAIL = "marioreis@id.uff.br";
const EMAIL_FROM = "TERMO <contatos@termo.app.br>";
const EMAIL_REPLY_TO = "marioreis@id.uff.br";
const MAX_RECIPIENTS_PER_CAMPAIGN = 100;
const COMMUNICATION_TIMEZONE = "America/Sao_Paulo";
const QUIET_HOURS_START = 21;
const QUIET_HOURS_END = 8;
const MAX_PER_24_HOURS = 1;
const MAX_PER_7_DAYS = 2;
const COERCIVE_PATTERNS = [
  /última chance/i,
  /agora ou nunca/i,
  /(?:você|voce) perder[aá] seus pontos/i,
  /n[aã]o perca seus pontos/i,
  /sua sequ[eê]ncia acaba/i,
  /suba no ranking/i
];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function getAdminEmail(env) {
  return normalizeEmail(env.TERMO_EMAIL_TEST_ADMIN || DEFAULT_ADMIN_EMAIL);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraphHtml(value) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(function (paragraph) {
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${paragraph.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function validHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function buildDraft(input = {}) {
  const subject = normalizeText(input.subject, 140);
  const message = normalizeText(input.message, 5000);
  const ctaLabel = normalizeText(input.ctaLabel, 80);
  const ctaUrlInput = normalizeText(input.ctaUrl, 2048);
  const ctaUrl = validHttpUrl(ctaUrlInput);

  if (!subject || !message) return { error: "Preencha assunto e mensagem." };
  if (ctaUrlInput && !ctaUrl) return { error: "O link do botão precisa começar com http:// ou https://." };
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { error: "Informe o texto e o link do botão juntos, ou deixe ambos em branco." };
  }
  if (COERCIVE_PATTERNS.some(function (pattern) { return pattern.test(`${subject}\n${message}`); })) {
    return { error: "A mensagem contém urgência artificial, ameaça de perda ou pressão incompatível com a comunicação responsável do TERMO." };
  }

  return { subject, message, ctaLabel, ctaUrl };
}

function buildEmail({ draft, destination, campaignId, unsubscribeToken = "", test = false }) {
  const cta = draft.ctaUrl
    ? `<p style="margin:8px 0 26px;"><a href="${escapeHtml(draft.ctaUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#00518e;color:#ffffff;font-weight:700;text-decoration:none;">${escapeHtml(draft.ctaLabel)}</a></p>`
    : "";
  const unsubscribeUrl = unsubscribeToken
    ? `https://termo.app.br/unsubscribe.html?token=${encodeURIComponent(unsubscribeToken)}`
    : "";
  const footerText = test
    ? "Mensagem de teste enviada somente ao administrador do TERMO. Nenhum inscrito recebeu esta mensagem."
    : "Você recebeu esta mensagem porque ativou o recebimento de novidades e recursos do TERMO. O uso do aplicativo não depende destas mensagens.";
  const footerHtml = unsubscribeUrl
    ? `${escapeHtml(footerText)} <a href="${escapeHtml(unsubscribeUrl)}" style="color:#00518e;">Cancelar novidades por e-mail</a>.`
    : escapeHtml(footerText);

  return {
    from: EMAIL_FROM,
    to: [destination],
    reply_to: EMAIL_REPLY_TO,
    subject: draft.subject,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f7fb;color:#142b44;font-family:Arial,Helvetica,sans-serif;"><main style="max-width:600px;margin:0 auto;padding:32px 20px;"><section style="background:#ffffff;border:1px solid #dbe5f0;border-radius:16px;padding:32px;"><p style="margin:0 0 14px;color:#00518e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">TERMO</p><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;">${escapeHtml(draft.subject)}</h1>${paragraphHtml(draft.message)}${cta}</section><p style="margin:18px 0 0;color:#5d6d7e;font-size:12px;line-height:1.5;">${footerHtml}</p></main></body></html>`,
    text: `TERMO\n\n${draft.subject}\n\n${draft.message}${draft.ctaUrl ? `\n\n${draft.ctaLabel}: ${draft.ctaUrl}` : ""}\n\n${footerText}${unsubscribeUrl ? `\nCancelar novidades: ${unsubscribeUrl}` : ""}`,
    tags: [
      { name: "category", value: test ? "campaign-test" : "campaign" },
      { name: "campaign", value: campaignId }
    ]
  };
}

async function resolveAdmin(headers, env) {
  const config = ensureSupabaseServerConfig(env);
  const accessToken = readBearerToken(headers);
  if (!config || !accessToken) return { config, user: null };
  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });
  if (normalizeEmail(user?.email) !== getAdminEmail(env)) return { config, user: null };
  return { config, user };
}

async function fetchAuthUsers(config) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`
    }
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(function () { return null; });
  return Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : null;
}

function hourInCommunicationTimezone(date) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: COMMUNICATION_TIMEZONE,
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).find(function (part) { return part.type === "hour"; });
  return Number(hour?.value || 0);
}

function isQuietHours(date) {
  const hour = hourInCommunicationTimezone(date);
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

async function getRecentCampaignDeliveries(config, nowDate) {
  const since = new Date(nowDate.getTime() - 7 * 86400000).toISOString();
  const response = await supabaseRestRequest({
    config,
    path: "email_recipient_deliveries",
    params: {
      select: "user_id,sent_at",
      delivery_kind: "eq.campaign",
      status: "eq.sent",
      sent_at: `gte.${since}`,
      limit: 5000
    }
  });
  return {
    ok: Boolean(response.ok),
    rows: response.ok && Array.isArray(response.payload) ? response.payload : []
  };
}

async function getEligibleRecipients(config, nowDate) {
  const preferences = await supabaseRestRequest({
    config,
    path: "user_legal_preferences",
    params: {
      select: "user_id,email_updates_paused_until,email_unsubscribe_token",
      email_updates_opted_in: "is.true",
      terms_version: `eq.${TERMS_VERSION}`,
      terms_accepted_at: "not.is.null",
      privacy_version: `eq.${PRIVACY_VERSION}`,
      privacy_acknowledged_at: "not.is.null",
      limit: MAX_RECIPIENTS_PER_CAMPAIGN
    }
  });
  if (!preferences.ok) return { error: "Não foi possível carregar as preferências de e-mail." };

  const preferenceRows = (Array.isArray(preferences.payload) ? preferences.payload : []).filter(function (row) {
    const pausedUntil = row.email_updates_paused_until ? new Date(row.email_updates_paused_until) : null;
    return !pausedUntil || Number.isNaN(pausedUntil.getTime()) || pausedUntil <= nowDate;
  });
  const preferenceByUser = new Map(preferenceRows.map(function (row) {
    return [String(row.user_id || ""), row];
  }));
  const optedInIds = new Set(preferenceByUser.keys());
  if (!optedInIds.size) return { recipients: [] };

  const users = await fetchAuthUsers(config);
  if (!users) return { error: "Não foi possível carregar os destinatários autorizados." };

  const recentDeliveryResult = await getRecentCampaignDeliveries(config, nowDate);
  if (!recentDeliveryResult.ok) {
    return { error: "Não foi possível verificar o limite de frequência; o envio foi bloqueado por segurança." };
  }
  const recentDeliveries = recentDeliveryResult.rows;
  const deliveryByUser = new Map();
  recentDeliveries.forEach(function (row) {
    const userId = String(row.user_id || "");
    if (!deliveryByUser.has(userId)) deliveryByUser.set(userId, []);
    const sentAt = new Date(row.sent_at || "");
    if (!Number.isNaN(sentAt.getTime())) deliveryByUser.get(userId).push(sentAt);
  });

  const eligible = users
      .filter(function (user) { return optedInIds.has(String(user.id || "")) && normalizeEmail(user.email); })
      .map(function (user) {
        const preference = preferenceByUser.get(String(user.id)) || {};
        return {
          id: String(user.id),
          email: normalizeEmail(user.email),
          unsubscribeToken: String(preference.email_unsubscribe_token || "")
        };
      })
      .filter(function (recipient) {
        const deliveries = deliveryByUser.get(recipient.id) || [];
        const in24Hours = deliveries.filter(function (date) { return nowDate - date < 86400000; }).length;
        return in24Hours < MAX_PER_24_HOURS && deliveries.length < MAX_PER_7_DAYS;
      })
      .sort(function (a, b) { return a.email.localeCompare(b.email); });

  return {
    recipients: eligible,
    optedInCount: optedInIds.size,
    excludedByFrequencyCap: Math.max(0, optedInIds.size - eligible.length)
  };
}

function selectRecipients(eligibleRecipients, input) {
  const audienceType = input.audienceType === "selected_users" ? "selected_users" : "all_opted_in";
  if (audienceType === "all_opted_in") return { audienceType, recipients: eligibleRecipients };
  const selected = new Set(Array.isArray(input.recipientIds) ? input.recipientIds.map(String) : []);
  return {
    audienceType,
    recipients: eligibleRecipients.filter(function (recipient) { return selected.has(recipient.id); })
  };
}

async function sendWithResend(apiKey, email, idempotencyKey) {
  const response = await fetch(RESEND_EMAILS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(email)
  });
  const payload = await response.json().catch(function () { return {}; });
  return { ok: response.ok, id: String(payload?.id || "") };
}

async function recordRecipientDeliveries(config, campaignId, recipients, deliveries, subject) {
  const rows = recipients.map(function (recipient, index) {
    const delivery = deliveries[index] || {};
    return {
      campaign_id: campaignId,
      user_id: recipient.id,
      delivery_kind: "campaign",
      idempotency_key: `${campaignId}:${recipient.id}`,
      subject,
      status: delivery.ok ? "sent" : "failed",
      resend_message_id: delivery.id || null,
      sent_at: new Date().toISOString()
    };
  });
  if (!rows.length) return;
  // This is an audit improvement introduced after the original campaign table.
  // Do not turn a successful delivery into a false failure if its migration is
  // still awaiting application.
  await supabaseRestRequest({
    config,
    path: "email_recipient_deliveries",
    method: "POST",
    prefer: "return=minimal,resolution=ignore-duplicates",
    body: rows
  });
}

function createCampaignId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `campaign-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function handleEmailCampaignRequest({ method, headers = {}, body, env = process.env, now = function () { return new Date(); } }) {
  if (method !== "POST") return jsonResponse(405, { error: "Use POST." });

  const { config, user } = await resolveAdmin(headers, env);
  if (!config) return jsonResponse(500, { error: "A comunicação ainda não está configurada no servidor." });
  if (!user?.id) return jsonResponse(403, { error: "Esta área está disponível apenas para o administrador do TERMO." });

  const input = parseJsonBody(body);
  const action = String(input.action || "");
  const nowDate = now();
  const audience = await getEligibleRecipients(config, nowDate);
  if (audience.error) return jsonResponse(502, { error: audience.error });
  const selection = selectRecipients(audience.recipients, input);

  if (action === "audience") {
    return jsonResponse(200, {
      recipients: audience.recipients.map(function (recipient) { return { id: recipient.id, email: recipient.email }; }),
      totalEligible: audience.recipients.length,
      optedInCount: Number(audience.optedInCount || audience.recipients.length),
      excludedByFrequencyCap: Number(audience.excludedByFrequencyCap || 0)
    });
  }

  const draft = buildDraft(input);
  if (draft.error) return jsonResponse(400, { error: draft.error });
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) return jsonResponse(500, { error: "O envio de e-mail ainda não está configurado." });

  if (action === "test") {
    const campaignId = `test-${createCampaignId()}`;
    const result = await sendWithResend(apiKey, buildEmail({ draft, destination: getAdminEmail(env), campaignId, test: true }), campaignId);
    if (!result.ok) return jsonResponse(502, { error: "O serviço de e-mail recusou o teste. Confira o Resend." });
    return jsonResponse(200, { sent: true, destination: getAdminEmail(env) });
  }

  if (action !== "send") return jsonResponse(400, { error: "Escolha uma ação válida." });
  if (isQuietHours(nowDate)) {
    return jsonResponse(400, { error: "Envios reais ficam bloqueados entre 21h e 8h (horário de Brasília). Tente novamente fora do período de silêncio." });
  }
  if (input.confirmationText !== "ENVIAR" || Number(input.confirmRecipientCount) !== selection.recipients.length) {
    return jsonResponse(400, { error: "Confirme o texto ENVIAR e a quantidade de destinatários antes do envio." });
  }
  if (!selection.recipients.length) return jsonResponse(400, { error: "Não há destinatários com opt-in para este envio." });

  const campaignId = createCampaignId();
  const created = await supabaseRestRequest({
    config,
    path: "email_campaigns",
    method: "POST",
    prefer: "return=minimal",
    body: {
      id: campaignId,
      created_by: user.id,
      audience_type: selection.audienceType,
      recipient_count: selection.recipients.length,
      subject: draft.subject,
      message: draft.message,
      cta_label: draft.ctaLabel || null,
      cta_url: draft.ctaUrl || null,
      status: "sending"
    }
  });
  if (!created.ok) return jsonResponse(500, { error: "Não foi possível registrar a campanha. A migração de comunicação ainda não está aplicada." });

  const deliveries = await Promise.all(selection.recipients.map(async function (recipient) {
    return sendWithResend(apiKey, buildEmail({
      draft,
      destination: recipient.email,
      campaignId,
      unsubscribeToken: recipient.unsubscribeToken
    }), `${campaignId}-${recipient.id}`);
  }));
  await recordRecipientDeliveries(config, campaignId, selection.recipients, deliveries, draft.subject);
  const messageIds = deliveries.map(function (delivery) { return delivery.id; }).filter(Boolean);
  const deliveredCount = deliveries.filter(function (delivery) { return delivery.ok; }).length;
  const failedCount = deliveries.length - deliveredCount;
  const status = failedCount === 0 ? "sent" : deliveredCount ? "partial_failure" : "failed";
  await supabaseRestRequest({
    config,
    path: "email_campaigns",
    method: "PATCH",
    params: { id: `eq.${campaignId}` },
    prefer: "return=minimal",
    body: { status, delivered_count: deliveredCount, failed_count: failedCount, resend_message_ids: messageIds }
  });

  return jsonResponse(200, { sent: true, campaignId, deliveredCount, failedCount, recipientCount: selection.recipients.length });
}
