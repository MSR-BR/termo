import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { handleAppRatingRequest } from "../lib/app-rating-handler.mjs";

const frontendSource = await readFile(new URL("../assets/termo-rating.js", import.meta.url), "utf8");
const privacySource = await readFile(new URL("../privacidade.html", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../supabase/migrations/20260831211239_create_app_ratings.sql", import.meta.url), "utf8");

const env = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret"
};

function mockJson(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get() { return "application/json"; } },
    async json() { return payload; },
    async text() { return JSON.stringify(payload); }
  };
}

async function withMockFetch(mock, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function authenticatedPost(overrides = {}) {
  return {
    method: "POST",
    headers: { authorization: "Bearer user-token" },
    body: {
      rating: 2,
      feedback: "  Mais exemplos.  ",
      pagePath: "/index.html?view=chapters",
      visitCount: 3,
      contentViewCount: 7,
      ...overrides
    },
    env
  };
}

test("rejects invalid ratings before contacting Supabase", async function () {
  const response = await handleAppRatingRequest({
    method: "POST",
    body: { rating: 6 },
    env
  });
  assert.equal(response.status, 400);
});

test("requires an authenticated account to submit a rating", async function () {
  const response = await handleAppRatingRequest({
    method: "POST",
    body: { rating: 5 },
    env
  });
  assert.equal(response.status, 401);
});

test("stores only a server-derived hash and normalized bounded fields", async function () {
  let databaseRequest = null;
  await withMockFetch(async function (url, options = {}) {
    if (String(url).includes("/auth/v1/user")) {
      return mockJson({ id: "account-one", email: "reader@example.test" });
    }
    databaseRequest = { url, options, body: JSON.parse(options.body) };
    return mockJson([], 201);
  }, async function () {
    const response = await handleAppRatingRequest(authenticatedPost({
      visitorToken: "ignored-browser-token"
    }));

    assert.equal(response.status, 200);
    assert.equal(databaseRequest.body.rating, 2);
    assert.equal(databaseRequest.body.feedback, "Mais exemplos.");
    assert.equal(databaseRequest.body.feedback_prompt, "improvement");
    assert.equal(databaseRequest.body.visitor_hash.length, 64);
    assert.equal(databaseRequest.body.visitorToken, undefined);
    assert.equal(databaseRequest.body.user_id, undefined);
    assert.equal(databaseRequest.body.email, undefined);
    assert.equal(JSON.stringify(databaseRequest.body).includes("account-one"), false);
    assert.equal(JSON.stringify(databaseRequest.body).includes("reader@example.test"), false);
    assert.equal(JSON.stringify(databaseRequest.body).includes("ignored-browser-token"), false);
    assert.match(databaseRequest.options.headers.Prefer, /resolution=merge-duplicates/);
  });
});

test("the same account produces the same upsert hash across local browser states", async function () {
  const rows = [];
  await withMockFetch(async function (url, options = {}) {
    if (String(url).includes("/auth/v1/user")) {
      return mockJson({ id: "stable-account", email: "reader@example.test" });
    }
    rows.push(JSON.parse(options.body));
    return mockJson([], 201);
  }, async function () {
    await handleAppRatingRequest(authenticatedPost({ visitorToken: "origin-a", rating: 4 }));
    await handleAppRatingRequest(authenticatedPost({ visitorToken: "origin-b", rating: 5 }));
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].visitor_hash, rows[1].visitor_hash);
});

test("different authenticated accounts produce different hashes", async function () {
  const rows = [];
  await withMockFetch(async function (url, options = {}) {
    if (String(url).includes("/auth/v1/user")) {
      const token = String(options.headers.Authorization || "");
      return mockJson({ id: token.endsWith("token-a") ? "account-a" : "account-b" });
    }
    rows.push(JSON.parse(options.body));
    return mockJson([], 201);
  }, async function () {
    await handleAppRatingRequest({ ...authenticatedPost(), headers: { authorization: "Bearer token-a" } });
    await handleAppRatingRequest({ ...authenticatedPost(), headers: { authorization: "Bearer token-b" } });
  });

  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].visitor_hash, rows[1].visitor_hash);
});

test("an authenticated account can query only whether it already rated", async function () {
  let databaseUrl = "";
  await withMockFetch(async function (url) {
    if (String(url).includes("/auth/v1/user")) {
      return mockJson({ id: "status-account", email: "reader@example.test" });
    }
    databaseUrl = String(url);
    return mockJson([{ id: 91 }]);
  }, async function () {
    const response = await handleAppRatingRequest({
      method: "GET",
      query: { scope: "status" },
      headers: { authorization: "Bearer user-token" },
      env
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true, rated: true });
  });

  const url = new URL(databaseUrl);
  assert.equal(url.searchParams.get("select"), "id");
  assert.match(url.searchParams.get("visitor_hash"), /^eq\.[a-f0-9]{64}$/);
  assert.equal(url.searchParams.has("email"), false);
});

test("anonymous accounts cannot query rating status", async function () {
  const response = await handleAppRatingRequest({
    method: "GET",
    query: { scope: "status" },
    headers: {},
    env
  });
  assert.equal(response.status, 401);
});

test("frontend checks server status, authenticates submission and applies failure cooldown", function () {
  assert.match(frontendSource, /Como você avalia o TERMO\?/);
  assert.doesNotMatch(frontendSource, /avalie (?:este|o) app com 5 estrelas/i);
  assert.match(frontendSource, /visits >= 3 \|\| \(visits >= 2 && contentViews >= 2\)/);
  assert.match(frontendSource, /30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(frontendSource, /FAILURE_COOLDOWN_MS = 60 \* 60 \* 1000/);
  assert.match(frontendSource, /if \(state\.ratedAt\) return false/);
  assert.match(frontendSource, /submitFailedUntil/);
  assert.match(frontendSource, /\/api\/app-rating\?scope=status/);
  assert.match(frontendSource, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.doesNotMatch(frontendSource, /visitorToken/);
  assert.doesNotMatch(frontendSource, /Sua resposta é anônima/i);
  assert.match(frontendSource, /Não armazenamos seu nome ou e-mail junto à avaliação/);
  assert.match(frontendSource, /Não inclua nome, e-mail ou outros dados pessoais/);
});

test("privacy notice accurately documents pseudonymous account deduplication", function () {
  assert.match(privacySource, /código pseudônimo calculado no servidor/);
  assert.match(privacySource, /não armazena nome nem endereço de e-mail/);
  assert.match(privacySource, /uma única avaliação por conta/);
});

test("database denies public access, constrains ratings and has a unique hash", function () {
  assert.match(migrationSource, /visitor_hash text not null unique/i);
  assert.match(migrationSource, /alter table public\.app_ratings enable row level security/i);
  assert.match(migrationSource, /revoke all on public\.app_ratings from anon, authenticated/i);
  assert.match(migrationSource, /rating between 1 and 5/i);
  assert.doesNotMatch(migrationSource, /grant .*app_ratings to anon/i);
  assert.doesNotMatch(migrationSource, /grant .*app_ratings to authenticated/i);
});

test("only the configured administrator can list ratings", async function () {
  await withMockFetch(async function (url) {
    if (String(url).includes("/auth/v1/user")) {
      return mockJson({ id: "admin-1", email: "marioreis@id.uff.br" });
    }
    return mockJson([
      { id: 1, rating: 5, feedback: "Muito útil", updated_at: "2026-08-31T12:00:00Z" },
      { id: 2, rating: 3, feedback: null, updated_at: "2026-08-31T11:00:00Z" }
    ]);
  }, async function () {
    const response = await handleAppRatingRequest({
      method: "GET",
      headers: { authorization: "Bearer admin-token" },
      env
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.summary.total, 2);
    assert.equal(response.body.summary.average, 4);
    assert.equal(response.body.summary.distribution[5], 1);
  });
});

test("non-admin accounts cannot list ratings", async function () {
  await withMockFetch(async function (url) {
    if (String(url).includes("/auth/v1/user")) {
      return mockJson({ id: "reader-1", email: "reader@example.test" });
    }
    throw new Error("database should not be contacted");
  }, async function () {
    const response = await handleAppRatingRequest({
      method: "GET",
      headers: { authorization: "Bearer reader-token" },
      env
    });
    assert.equal(response.status, 403);
  });
});
