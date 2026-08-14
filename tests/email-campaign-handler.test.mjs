import assert from "node:assert/strict";
import test from "node:test";

import { handleEmailCampaignRequest } from "../lib/email-campaign-handler.mjs";

const BASE_ENV = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
  RESEND_API_KEY: "re_test_secret"
};

function createJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get() { return "application/json"; } },
    async json() { return payload; },
    async text() { return JSON.stringify(payload); }
  };
}

async function withMockedFetch(mockImpl, callback) {
  const originalFetch = global.fetch;
  global.fetch = mockImpl;
  try {
    return await callback();
  } finally {
    global.fetch = originalFetch;
  }
}

function adminResponse(url) {
  if (String(url).endsWith("/auth/v1/user")) {
    return createJsonResponse({ id: "admin-1", email: "marioreis@id.uff.br" });
  }
  if (String(url).includes("/rest/v1/user_legal_preferences")) {
    return createJsonResponse([{ user_id: "student-1" }, { user_id: "student-2" }]);
  }
  if (String(url).includes("/auth/v1/admin/users")) {
    return createJsonResponse({ users: [
      { id: "student-1", email: "ana@example.com" },
      { id: "student-2", email: "bruno@example.com" },
      { id: "student-3", email: "sem-optin@example.com" }
    ] });
  }
  return null;
}

test("campaign audience lists only users with email opt-in", async function () {
  const response = await withMockedFetch(async function (url) {
    const known = adminResponse(url);
    if (known) return known;
    throw new Error(`Unexpected request: ${url}`);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: { action: "audience", audienceType: "all_opted_in" },
      env: BASE_ENV
    });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.recipients, [
    { id: "student-1", email: "ana@example.com" },
    { id: "student-2", email: "bruno@example.com" }
  ]);
});

test("campaign test sends only to the administrator", async function () {
  let sentEmail = null;
  const response = await withMockedFetch(async function (url, options = {}) {
    const known = adminResponse(url);
    if (known) return known;
    if (String(url) === "https://api.resend.com/emails") {
      sentEmail = JSON.parse(options.body);
      return createJsonResponse({ id: "test-1" });
    }
    throw new Error(`Unexpected request: ${url}`);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: { action: "test", subject: "Novidades", message: "Mensagem de teste" },
      env: BASE_ENV
    });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(sentEmail.to, ["marioreis@id.uff.br"]);
  assert.equal(sentEmail.from, "TERMO <contatos@termo.app.br>");
  assert.equal(sentEmail.reply_to, "marioreis@id.uff.br");
});

test("campaign refuses a real send without explicit confirmation", async function () {
  let sent = false;
  const response = await withMockedFetch(async function (url) {
    const known = adminResponse(url);
    if (known) return known;
    if (String(url) === "https://api.resend.com/emails") sent = true;
    return createJsonResponse({}, 500);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: {
        action: "send",
        audienceType: "all_opted_in",
        subject: "Novidades",
        message: "Mensagem real",
        confirmRecipientCount: 2,
        confirmationText: "confirmar"
      },
      env: BASE_ENV
    });
  });

  assert.equal(response.status, 400);
  assert.equal(sent, false);
});
