import assert from "node:assert/strict";
import test from "node:test";

import { handleLearningEvaluationReportRequest } from "../lib/learning-evaluation-report-handler.mjs";

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

function five(factory) {
  return Array.from({ length: 5 }, function (_, index) { return factory(index); });
}

test("evaluation report is admin-only, aggregated and explicit about limitations", async function () {
  const original = global.fetch;
  global.fetch = async function (url) {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return response({ id: "admin-1", email: "marioreis@id.uff.br" });
    if (value.includes("/rest/v1/gamification_event_log")) return response(five(function () {
      return { event_type: "chapter_quiz_completed", shared_event_type: "assessment_completed", evidence_class: "independent_retrieval", reward_eligible: true, xp_delta: 30, concept_ids: ["c1"], source_ids: ["s1"] };
    }));
    if (value.includes("/rest/v1/chapter_quiz_attempts")) return response(five(function () {
      return { attempt_type: "full_quiz", score: 80, question_count: 5, feedback: [] };
    }));
    if (value.includes("/rest/v1/app_analytics_events")) return response(five(function () { return { event_name: "quiz_start" }; }));
    if (value.includes("/rest/v1/app_ratings")) return response(five(function () { return { rating: 5 }; }));
    if (value.includes("/rest/v1/user_legal_preferences")) return response(five(function () { return { email_updates_opted_in: true }; }));
    if (value.includes("/rest/v1/email_recipient_deliveries")) return response(five(function () { return { delivery_kind: "campaign", status: "sent", sent_at: "2026-09-25T12:00:00.000Z" }; }));
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const result = await handleLearningEvaluationReportRequest({
      method: "GET",
      headers: { authorization: "Bearer token" },
      query: { days: "28" },
      env: ENV,
      now: function () { return new Date("2026-09-25T15:00:00.000Z"); }
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.privacy.individualRowsReturned, false);
    assert.equal(result.body.learning.attempts.value, 5);
    assert.equal(result.body.learning.averageObservedScore, 80);
    assert.equal(result.body.learning.baseline.status, "not_collected");
    assert.match(result.body.learning.exactOutcome, /não é uma estimativa causal/i);
    const serialized = JSON.stringify(result.body);
    assert.doesNotMatch(serialized, /student@example\.com|admin-1|user_id|session_id|"feedback"|"answers"/i);
  } finally {
    global.fetch = original;
  }
});

test("evaluation report refuses another signed-in account", async function () {
  const original = global.fetch;
  global.fetch = async function (url) {
    if (String(url).endsWith("/auth/v1/user")) return response({ id: "student-1", email: "student@example.com" });
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const result = await handleLearningEvaluationReportRequest({
      method: "GET",
      headers: { authorization: "Bearer token" },
      env: ENV
    });
    assert.equal(result.status, 403);
  } finally {
    global.fetch = original;
  }
});
