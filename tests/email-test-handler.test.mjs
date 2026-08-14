import assert from "node:assert/strict";
import test from "node:test";

import { handleEmailTestRequest } from "../lib/email-test-handler.mjs";

const BASE_ENV = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  RESEND_API_KEY: "re_test_secret"
};

function createJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    }
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

test("email test requires an authenticated administrator", async function () {
  const response = await handleEmailTestRequest({
    method: "POST",
    env: BASE_ENV
  });

  assert.equal(response.status, 401);
});

test("email test sends only to the configured administrator", async function () {
  const calls = [];
  const response = await withMockedFetch(async function (url, options = {}) {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse({ id: "admin-1", email: "marioreis@id.uff.br" });
    }
    if (String(url) === "https://api.resend.com/emails") {
      const body = JSON.parse(options.body);
      assert.deepEqual(body.to, ["marioreis@id.uff.br"]);
      assert.equal(body.from, "TERMO <contatos@termo.app.br>");
      assert.equal(body.reply_to, "marioreis@id.uff.br");
      assert.equal(options.headers.Authorization, "Bearer re_test_secret");
      return createJsonResponse({ id: "email-test-1" }, 200);
    }
    throw new Error(`Unexpected request: ${url}`);
  }, async function () {
    return handleEmailTestRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      env: BASE_ENV
    });
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { sent: true, destination: "marioreis@id.uff.br" });
  assert.equal(calls.filter((call) => call.url === "https://api.resend.com/emails").length, 1);
});

test("email test cannot be triggered by another signed-in account", async function () {
  let sent = false;
  const response = await withMockedFetch(async function (url) {
    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse({ id: "student-1", email: "student@example.com" });
    }
    if (String(url) === "https://api.resend.com/emails") sent = true;
    return createJsonResponse({}, 500);
  }, async function () {
    return handleEmailTestRequest({
      method: "POST",
      headers: { authorization: "Bearer access-token" },
      env: BASE_ENV
    });
  });

  assert.equal(response.status, 403);
  assert.equal(sent, false);
});
