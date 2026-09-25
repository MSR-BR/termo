import {
  ensureSupabaseServerConfig,
  jsonResponse,
  parseJsonBody,
  supabaseRestRequest
} from "./gamification-shared.mjs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleEmailUnsubscribeRequest({ method, body, env = process.env }) {
  if (method !== "POST") return jsonResponse(405, { error: "Use POST." });

  const config = ensureSupabaseServerConfig(env);
  if (!config) return jsonResponse(500, { error: "O descadastro ainda não está configurado." });

  const token = String(parseJsonBody(body).token || "").trim();
  if (!UUID_PATTERN.test(token)) {
    return jsonResponse(400, { error: "Link de descadastro inválido." });
  }

  const now = new Date().toISOString();
  const result = await supabaseRestRequest({
    config,
    path: "user_legal_preferences",
    method: "PATCH",
    params: { email_unsubscribe_token: `eq.${token}` },
    prefer: "return=minimal",
    body: {
      email_updates_opted_in: false,
      email_updates_opted_in_at: null,
      email_updates_opted_out_at: now,
      email_updates_paused_until: null
    }
  });

  if (!result.ok) {
    return jsonResponse(result.status || 500, { error: "Não foi possível concluir o descadastro agora." });
  }

  return jsonResponse(200, {
    ok: true,
    message: "O recebimento de novidades do TERMO foi desativado."
  });
}
