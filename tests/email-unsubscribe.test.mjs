import assert from "node:assert/strict";
import test from "node:test";

import { handleEmailUnsubscribeRequest } from "../lib/email-unsubscribe-handler.mjs";

const ENV = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test"
};

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get() { return "application/json"; } },
    async json() { return payload; },
    async text() { return JSON.stringify(payload); }
  };
}

test("unsubscribe rejects malformed tokens without touching the database", async function () {
  const original = global.fetch;
  let called = false;
  global.fetch = async function () { called = true; return response([]); };
  try {
    const result = await handleEmailUnsubscribeRequest({ method: "POST", body: { token: "invalid" }, env: ENV });
    assert.equal(result.status, 400);
    assert.equal(called, false);
  } finally {
    global.fetch = original;
  }
});

test("unsubscribe disables messages without returning identity data", async function () {
  const original = global.fetch;
  let request = null;
  global.fetch = async function (url, options = {}) {
    request = { url: String(url), options };
    return response([]);
  };
  try {
    const result = await handleEmailUnsubscribeRequest({
      method: "POST",
      body: { token: "11111111-1111-4111-8111-111111111111" },
      env: ENV
    });
    assert.equal(result.status, 200);
    const body = JSON.parse(request.options.body);
    assert.equal(body.email_updates_opted_in, false);
    assert.equal(body.email_updates_paused_until, null);
    assert.doesNotMatch(JSON.stringify(result.body), /user_id|email|token/i);
  } finally {
    global.fetch = original;
  }
});
