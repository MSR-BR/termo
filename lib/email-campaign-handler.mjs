import {
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  parseJsonBody,
  readBearerToken,
  supabaseRestRequest
} from "./gamification-shared.mjs";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_ADMIN_EMAIL = "marioreis@id.uff.br";
const EMAIL_FROM = "TERMO <contatos@termo.app.br>";
const EMAIL_REPLY_TO = "marioreis@id.uff.br";
const MAX_RECIPIENTS_PER_CAMPAIGN = 100;

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

  return { subject, message, ctaLabel, ctaUrl };
}

function buildEmail({ draft, destination, campaignId, test = false }) {
  const cta = draft.ctaUrl
    ? `<p style="margin:8px 0 26px;"><a href="${escapeHtml(draft.ctaUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#00518e;color:#ffffff;font-weight:700;text-decoration:none;">${escapeHtml(draft.ctaLabel)}</a></p>`
    : "";
  const footer = test
    ? "Mensagem de teste enviada somente ao administrador do TERMO. Nenhum inscrito recebeu esta mensagem."
    : "Você recebeu esta mensagem porque ativou o recebimento de novidades e recursos do TERMO. Para cancelar, entre na sua conta e altere a preferência de e-mail na Área Pessoal.";

  return {
    from: EMAIL_FROM,
    to: [destination],
    reply_to: EMAIL_REPLY_TO,
    subject: draft.subject,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f7fb;color:#142b44;font-family:Arial,Helvetica,sans-serif;"><main style="max-width:600px;margin:0 auto;padding:32px 20px;"><section style="background:#ffffff;border:1px solid #dbe5f0;border-radius:16px;padding:32px;"><p style="margin:0 0 14px;color:#00518e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">TERMO</p><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;">${escapeHtml(draft.subject)}</h1>${paragraphHtml(draft.message)}${cta}</section><p style="margin:18px 0 0;color:#5d6d7e;font-size:12px;line-height:1.5;">${footer}</p></main></body></html>`,
    text: `TERMO\n\n${draft.subject}\n\n${draft.message}${draft.ctaUrl ? `\n\n${draft.ctaLabel}: ${draft.ctaUrl}` : ""}\n\n${footer}`,
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

async function getEligibleRecipients(config) {
  const preferences = await supabaseRestRequest({
    config,
    path: "user_legal_preferences",
    params: { select: "user_id", email_updates_opted_in: "is.true", limit: MAX_RECIPIENTS_PER_CAMPAIGN }
  });
  if (!preferences.ok) return { error: "Não foi possível carregar as preferências de e-mail." };

  const optedInIds = new Set((Array.isArray(preferences.payload) ? preferences.payload : []).map(function (row) {
    return String(row.user_id || "");
  }));
  if (!optedInIds.size) return { recipients: [] };

  const users = await fetchAuthUsers(config);
  if (!users) return { error: "Não foi possível carregar os destinatários autorizados." };

  return {
    recipients: users
      .filter(function (user) { return optedInIds.has(String(user.id || "")) && normalizeEmail(user.email); })
      .map(function (user) { return { id: String(user.id), email: normalizeEmail(user.email) }; })
      .sort(function (a, b) { return a.email.localeCompare(b.email); })
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

function createCampaignId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `campaign-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function handleEmailCampaignRequest({ method, headers = {}, body, env = process.env }) {
  if (method !== "POST") return jsonResponse(405, { error: "Use POST." });

  const { config, user } = await resolveAdmin(headers, env);
  if (!config) return jsonResponse(500, { error: "A comunicação ainda não está configurada no servidor." });
  if (!user?.id) return jsonResponse(403, { error: "Esta área está disponível apenas para o administrador do TERMO." });

  const input = parseJsonBody(body);
  const action = String(input.action || "");
  const audience = await getEligibleRecipients(config);
  if (audience.error) return jsonResponse(502, { error: audience.error });
  const selection = selectRecipients(audience.recipients, input);

  if (action === "audience") {
    return jsonResponse(200, { recipients: audience.recipients, totalEligible: audience.recipients.length });
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
    return sendWithResend(apiKey, buildEmail({ draft, destination: recipient.email, campaignId }), `${campaignId}-${recipient.id}`);
  }));
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
