import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { handleAppRatingRequest } from "../lib/app-rating-handler.mjs";

const frontendSource = await readFile(new URL("../assets/termo-rating.js", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../supabase/migrations/20260831211239_create_app_ratings.sql", import.meta.url), "utf8");

const env = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret"
};

test("rejects invalid ratings before contacting Supabase", async function () {
  const response = await handleAppRatingRequest({
    method: "POST",
    body: { visitorToken: "a".repeat(32), rating: 6 },
    env
  });
  assert.equal(response.status, 400);
});

test("stores only a server hash and normalized bounded fields", async function () {
  const originalFetch = globalThis.fetch;
  let request = null;
  globalThis.fetch = async function (url, options) {
    request = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 201,
      headers: { get() { return "application/json"; } },
      async json() { return []; }
    };
  };

  try {
    const token = "visitor_" + "a".repeat(32);
    const response = await handleAppRatingRequest({
      method: "POST",
      body: {
        visitorToken: token,
        rating: 2,
        feedback: "  Mais exemplos.  ",
        pagePath: "/index.html?view=chapters",
        visitCount: 3,
        contentViewCount: 7
      },
      env
    });

    assert.equal(response.status, 200);
    assert.equal(request.body.rating, 2);
    assert.equal(request.body.feedback, "Mais exemplos.");
    assert.equal(request.body.feedback_prompt, "improvement");
    assert.equal(request.body.visitor_token, undefined);
    assert.equal(request.body.visitor_hash.length, 64);
    assert.equal(request.body.visitor_hash.includes(token), false);
    assert.match(request.options.headers.Prefer, /resolution=merge-duplicates/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("frontend uses neutral copy and respects return, dismissal and completion rules", function () {
  assert.match(frontendSource, /Como você avalia o TERMO\?/);
  assert.doesNotMatch(frontendSource, /avalie (?:este|o) app com 5 estrelas/i);
  assert.match(frontendSource, /visits >= 3 \|\| \(visits >= 2 && contentViews >= 2\)/);
  assert.match(frontendSource, /30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(frontendSource, /if \(state\.ratedAt\) return false/);
  assert.match(frontendSource, /Não inclua nome, e-mail ou outros dados pessoais/);
});

test("database denies public access and constrains rating values", function () {
  assert.match(migrationSource, /alter table public\.app_ratings enable row level security/i);
  assert.match(migrationSource, /revoke all on public\.app_ratings from anon, authenticated/i);
  assert.match(migrationSource, /rating between 1 and 5/i);
  assert.doesNotMatch(migrationSource, /grant .*app_ratings to anon/i);
  assert.doesNotMatch(migrationSource, /grant .*app_ratings to authenticated/i);
});

test("only the configured administrator can list ratings", async function () {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (url) {
    if (String(url).includes("/auth/v1/user")) {
      return {
        ok: true,
        status: 200,
        headers: { get() { return "application/json"; } },
        async json() { return { id: "admin-1", email: "marioreis@id.uff.br" }; }
      };
    }
    return {
      ok: true,
      status: 200,
      headers: { get() { return "application/json"; } },
      async json() {
        return [
          { id: 1, rating: 5, feedback: "Muito útil", updated_at: "2026-08-31T12:00:00Z" },
          { id: 2, rating: 3, feedback: null, updated_at: "2026-08-31T11:00:00Z" }
        ];
      }
    };
  };

  try {
    const response = await handleAppRatingRequest({
      method: "GET",
      headers: { authorization: "Bearer admin-token" },
      env
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.summary.total, 2);
    assert.equal(response.body.summary.average, 4);
    assert.equal(response.body.summary.distribution[5], 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anonymous requests cannot read ratings", async function () {
  const response = await handleAppRatingRequest({ method: "GET", headers: {}, env });
  assert.equal(response.status, 403);
});
