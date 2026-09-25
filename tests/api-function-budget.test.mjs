import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const apiEntries = readdirSync(new URL("../api/", import.meta.url), { withFileTypes: true });
const functionEntries = apiEntries.filter(function (entry) {
  return entry.isFile() && entry.name.endsWith(".js");
});
const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("Vercel Hobby deployment stays within the serverless function budget", function () {
  assert.ok(functionEntries.length <= 12, `Expected at most 12 functions, found ${functionEntries.length}.`);
});

test("T54 public API routes are preserved through internal rewrites", function () {
  const rewrites = Object.fromEntries(vercelConfig.rewrites.map(function (rewrite) {
    return [rewrite.source, rewrite.destination];
  }));
  assert.equal(rewrites["/api/email-unsubscribe"], "/api/legal-preferences?action=unsubscribe");
  assert.equal(rewrites["/api/learning-evaluation-report"], "/api/gamification-profile?action=evaluation-report");
});
