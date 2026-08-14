import {
  ensureSupabaseConfig,
  fetchAuthenticatedUser,
  jsonResponse,
  readBearerToken
} from "./gamification-shared.mjs";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TEST_ADMIN_EMAIL = "marioreis@id.uff.br";
const EMAIL_FROM = "TERMO <contatos@termo.app.br>";
const EMAIL_REPLY_TO = "marioreis@id.uff.br";
const TEST_DESTINATION_URL = "https://termo-theta.vercel.app/index.html?view=chapters&chapter=01&utm_source=email&utm_medium=owned&utm_campaign=email_test";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getTestAdminEmail(env) {
  return normalizeEmail(env.TERMO_EMAIL_TEST_ADMIN || DEFAULT_TEST_ADMIN_EMAIL);
}

function buildTestEmail() {
  return {
    from: EMAIL_FROM,
    to: [EMAIL_REPLY_TO],
    reply_to: EMAIL_REPLY_TO,
    subject: "Teste de envio — TERMO",
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f7fb;color:#142b44;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:600px;margin:0 auto;padding:32px 20px;">
      <section style="background:#ffffff;border:1px solid #dbe5f0;border-radius:16px;padding:32px;">
        <p style="margin:0 0 14px;color:#00518e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">TERMO</p>
        <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;">Envio de teste confirmado</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Este é um teste técnico do canal de e-mail do TERMO. Nenhum inscrito recebeu esta mensagem.</p>
        <p style="margin:0 0 26px;font-size:16px;line-height:1.6;">Confira o remetente, a aparência no celular e se uma resposta chega ao endereço configurado.</p>
        <p style="margin:0;"><a href="${TEST_DESTINATION_URL}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#00518e;color:#ffffff;font-weight:700;text-decoration:none;">Abrir Capítulo 1</a></p>
      </section>
      <p style="margin:18px 0 0;color:#5d6d7e;font-size:12px;line-height:1.5;">Mensagem de teste enviada somente ao administrador do TERMO.</p>
    </main>
  </body>
</html>`,
    text: `TERMO — envio de teste confirmado.\n\nEste é um teste técnico do canal de e-mail do TERMO. Nenhum inscrito recebeu esta mensagem.\n\nAbrir Capítulo 1: ${TEST_DESTINATION_URL}`,
    tags: [
      { name: "category", value: "email-test" },
      { name: "source", value: "admin" }
    ]
  };
}

async function getAuthenticatedUser(headers, env) {
  const config = ensureSupabaseConfig(env);
  const accessToken = readBearerToken(headers);
  if (!config || !accessToken) return null;

  return fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });
}

export async function handleEmailTestRequest({ method, headers = {}, env = process.env }) {
  if (method !== "POST") return jsonResponse(405, { error: "Use POST." });

  const user = await getAuthenticatedUser(headers, env);
  if (!user?.id) return jsonResponse(401, { error: "Entre com Google para enviar o teste." });
  if (normalizeEmail(user.email) !== getTestAdminEmail(env)) {
    return jsonResponse(403, { error: "Este teste está disponível apenas para o administrador." });
  }

  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) return jsonResponse(500, { error: "O envio de e-mail ainda não está configurado." });

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildTestEmail())
    });
  } catch {
    return jsonResponse(502, { error: "Não foi possível conectar ao serviço de e-mail." });
  }

  if (!resendResponse.ok) {
    return jsonResponse(502, { error: "O serviço de e-mail recusou o teste. Confira a configuração no Resend." });
  }

  return jsonResponse(200, { sent: true, destination: EMAIL_REPLY_TO });
}
