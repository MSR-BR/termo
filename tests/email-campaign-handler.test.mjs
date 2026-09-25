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
    return createJsonResponse([
      { user_id: "student-1", email_unsubscribe_token: "11111111-1111-4111-8111-111111111111", email_updates_paused_until: null },
      { user_id: "student-2", email_unsubscribe_token: "22222222-2222-4222-8222-222222222222", email_updates_paused_until: null }
    ]);
  }
  if (String(url).includes("/rest/v1/email_recipient_deliveries")) {
    return createJsonResponse([]);
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
  assert.equal(response.body.optedInCount, 2);
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
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
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
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
    });
  });

  assert.equal(response.status, 400);
  assert.equal(sent, false);
});

test("campaign rejects coercive copy before contacting Resend", async function () {
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
      body: { action: "test", subject: "Última chance", message: "Abra o TERMO." },
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
    });
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /urgência artificial/i);
  assert.equal(sent, false);
});

test("campaign blocks real sends during quiet hours", async function () {
  const response = await withMockedFetch(async function (url) {
    const known = adminResponse(url);
    if (known) return known;
    return createJsonResponse({}, 500);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: {
        action: "send",
        audienceType: "all_opted_in",
        subject: "Novidades",
        message: "Uma mensagem opcional.",
        confirmRecipientCount: 2,
        confirmationText: "ENVIAR"
      },
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T04:00:00.000Z"); }
    });
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /21h e 8h/);
});

test("real campaign contains a passwordless unsubscribe link", async function () {
  const sentEmails = [];
  const response = await withMockedFetch(async function (url, options = {}) {
    const known = adminResponse(url);
    if (known) return known;
    if (String(url).includes("/rest/v1/email_campaigns")) return createJsonResponse([]);
    if (String(url) === "https://api.resend.com/emails") {
      sentEmails.push(JSON.parse(options.body));
      return createJsonResponse({ id: `message-${sentEmails.length}` });
    }
    throw new Error(`Unexpected request: ${url}`);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: {
        action: "send",
        audienceType: "all_opted_in",
        subject: "Novidades",
        message: "Uma mensagem opcional.",
        confirmRecipientCount: 2,
        confirmationText: "ENVIAR"
      },
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
    });
  });

  assert.equal(response.status, 200);
  assert.equal(sentEmails.length, 2);
  assert.match(sentEmails[0].text, /unsubscribe\.html\?token=/);
  assert.match(sentEmails[0].html, /Cancelar novidades por e-mail/);
});

test("audience excludes recipients that reached the frequency cap", async function () {
  const response = await withMockedFetch(async function (url) {
    if (String(url).includes("/rest/v1/email_recipient_deliveries")) {
      return createJsonResponse([{ user_id: "student-1", sent_at: "2026-09-25T14:00:00.000Z" }]);
    }
    const known = adminResponse(url);
    if (known) return known;
    throw new Error(`Unexpected request: ${url}`);
  }, async function () {
    return handleEmailCampaignRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      body: { action: "audience" },
      env: BASE_ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
    });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.recipients, [{ id: "student-2", email: "bruno@example.com" }]);
  assert.equal(response.body.excludedByFrequencyCap, 1);
});
