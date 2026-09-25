import assert from "node:assert/strict";
import test from "node:test";

import { handleLegalPreferencesRequest, PRIVACY_VERSION } from "../lib/legal-preferences-handler.mjs";

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

async function withFetch(mock, run) {
  const original = global.fetch;
  global.fetch = mock;
  try { return await run(); } finally { global.fetch = original; }
}

test("missing legacy preference is normalized as opt-out", async function () {
  const result = await withFetch(async function (url) {
    if (String(url).endsWith("/auth/v1/user")) return response({ id: "user-1", email: "student@example.com" });
    if (String(url).includes("/rest/v1/user_legal_preferences")) return response([{}]);
    throw new Error(`Unexpected request: ${url}`);
  }, function () {
    return handleLegalPreferencesRequest({
      method: "GET",
      headers: { authorization: "Bearer token" },
      env: ENV
    });
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.emailUpdatesOptedIn, false);
  assert.equal(result.body.privacyCurrentVersion, PRIVACY_VERSION);
});

test("affirmative opt-in records its timestamp and clears pause", async function () {
  let requestBody = null;
  const result = await withFetch(async function (url, options = {}) {
    if (String(url).endsWith("/auth/v1/user")) return response({ id: "user-1", email: "student@example.com" });
    if (String(url).includes("/rest/v1/user_legal_preferences")) {
      requestBody = JSON.parse(options.body);
      return response([{ ...requestBody }]);
    }
    throw new Error(`Unexpected request: ${url}`);
  }, function () {
    return handleLegalPreferencesRequest({
      method: "PUT",
      headers: { authorization: "Bearer token" },
      body: { emailUpdatesOptedIn: true },
      env: ENV
    });
  });

  assert.equal(result.status, 200);
  assert.equal(requestBody.email_updates_opted_in, true);
  assert.ok(requestBody.email_updates_opted_in_at);
  assert.equal(requestBody.email_updates_paused_until, null);
});

test("pause accepts only the documented periods", async function () {
  const invalid = await withFetch(async function (url) {
    if (String(url).endsWith("/auth/v1/user")) return response({ id: "user-1" });
    throw new Error(`Unexpected request: ${url}`);
  }, function () {
    return handleLegalPreferencesRequest({
      method: "PUT",
      headers: { authorization: "Bearer token" },
      body: { emailPauseDays: 5 },
      env: ENV
    });
  });
  assert.equal(invalid.status, 400);

  let requestBody = null;
  const valid = await withFetch(async function (url, options = {}) {
    if (String(url).endsWith("/auth/v1/user")) return response({ id: "user-1" });
    if (String(url).includes("/rest/v1/user_legal_preferences")) {
      requestBody = JSON.parse(options.body);
      return response([{ ...requestBody }]);
    }
    throw new Error(`Unexpected request: ${url}`);
  }, function () {
    return handleLegalPreferencesRequest({
      method: "PUT",
      headers: { authorization: "Bearer token" },
      body: { emailPauseDays: 30 },
      env: ENV
    });
  });
  assert.equal(valid.status, 200);
  assert.ok(requestBody.email_updates_paused_until);
});
