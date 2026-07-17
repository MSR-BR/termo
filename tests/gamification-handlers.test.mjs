import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDefaultProfileRow,
  isGamificationRpcEnabled
} from "../lib/gamification-shared.mjs";
import { handleGamificationEventRequest } from "../lib/gamification-event-handler.mjs";
import { handleGamificationProfileRequest } from "../lib/gamification-profile-handler.mjs";
import { handleChapterQuizRequest } from "../lib/chapter-quiz-handler.mjs";

const BASE_ENV = {
  PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SERVICE_ROLE_KEY: "sb_service_role_test"
};

function createJsonResponse(payload, status = 200, extraHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const normalized = String(name || "").toLowerCase();
        if (normalized === "content-type") return "application/json";
        return extraHeaders[normalized] || null;
      }
    },
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
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

test("isGamificationRpcEnabled only turns on for explicit truthy values", function () {
  assert.equal(isGamificationRpcEnabled({ TERMO_GAMIFICATION_RPC_MODE: "true" }), true);
  assert.equal(isGamificationRpcEnabled({ TERMO_GAMIFICATION_RPC_MODE: "1" }), true);
  assert.equal(isGamificationRpcEnabled({ TERMO_GAMIFICATION_RPC_MODE: "false" }), false);
  assert.equal(isGamificationRpcEnabled({}), false);
});

test("chapter quiz GET returns published quiz without touching Supabase", async function () {
  const response = await handleChapterQuizRequest({
    method: "GET",
    query: { quizKey: "cap02" }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.quiz.quizKey, "cap02");
  assert.equal(response.body.quiz.questionCount, 5);
});

test("gamification event uses RPC path when feature flag is enabled", async function () {
  const user = { id: "user-123", email: "mario@example.com" };
  const profileRow = {
    ...buildDefaultProfileRow(user.id),
    user_id: user.id
  };
  const calls = [];

  await withMockedFetch(async function (url, options = {}) {
    calls.push({ url: String(url), method: options.method || "GET" });

    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse(user);
    }

    if (String(url).includes("/rest/v1/gamification_profiles")) {
      return createJsonResponse([profileRow]);
    }

    if (String(url).includes("/rest/v1/gamification_event_log")) {
      return createJsonResponse([]);
    }

    if (String(url).includes("/rest/v1/gamification_item_progress")) {
      return createJsonResponse([]);
    }

    if (String(url).includes("/rest/v1/rpc/apply_gamification_event_atomic")) {
      const body = JSON.parse(String(options.body || "{}"));
      assert.equal(body.p_event_type, "study_item_complete");
      assert.equal(body.p_item_progress_patch.item_key, "02:2.4");

      return createJsonResponse({
        ok: true,
        persisted: true,
        deduped: false,
        awarded: true,
        reason: "",
        profile: {
          ...profileRow,
          xp_total: 20,
          level: 1,
          current_streak: 1,
          best_streak: 1,
          last_active_on: "2026-07-16",
          studied_items_count: 1
        }
      });
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  }, async function () {
    const response = await handleGamificationEventRequest({
      method: "POST",
      headers: {
        authorization: "Bearer access-token"
      },
      body: {
        eventType: "study_item_complete",
        idempotencyKey: "study:02:2.4:2026-07-16",
        chapterId: "02",
        itemId: "2.4",
        occurredAt: "2026-07-16T10:00:00.000Z",
        payload: {
          pagePath: "/slides/capitulo-02/page_4.html"
        }
      },
      env: {
        ...BASE_ENV,
        TERMO_GAMIFICATION_RPC_MODE: "true"
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.persisted, true);
    assert.equal(response.body.profile.summary.xpTotal, 20);
    assert.equal(response.body.profile.summary.studiedItemsCount, 1);
  });

  assert.equal(calls.some(function (call) {
    return call.url.includes("/rest/v1/rpc/apply_gamification_event_atomic");
  }), true);
});

test("chapter quiz uses RPC path when feature flag is enabled", async function () {
  const user = { id: "user-quiz", email: "mario@example.com" };
  const profileRow = {
    ...buildDefaultProfileRow(user.id),
    user_id: user.id
  };
  const calls = [];

  await withMockedFetch(async function (url, options = {}) {
    calls.push({ url: String(url), method: options.method || "GET" });

    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse(user);
    }

    if (String(url).includes("/rest/v1/gamification_profiles")) {
      return createJsonResponse([profileRow]);
    }

    if (String(url).includes("/rest/v1/chapter_quiz_attempts")) {
      return createJsonResponse([]);
    }

    if (String(url).includes("/rest/v1/rpc/record_chapter_quiz_attempt_atomic")) {
      const body = JSON.parse(String(options.body || "{}"));
      assert.equal(body.p_quiz_key, "cap02");
      assert.equal(body.p_attempt_type, "full_quiz");
      assert.equal(body.p_question_count, 5);
      assert.equal(body.p_xp_awarded, 45);
      assert.equal(body.p_profile_patch.last_quiz_summary.isMastered, true);
      assert.equal(body.p_profile_patch.last_quiz_summary.isExcellent, true);
      assert.equal(body.p_profile_patch.last_quiz_summary.masteryThreshold, 80);
      assert.equal(body.p_profile_patch.next_action_json.type, "next_chapter_quiz");

      return createJsonResponse({
        ok: true,
        persisted: true,
        deduped: false,
        attempt_id: "attempt-123",
        event_id: 99,
        profile: {
          ...profileRow,
          xp_total: 45,
          level: 1,
          current_streak: 1,
          best_streak: 1,
          last_active_on: "2026-07-16",
          last_quiz_summary: body.p_profile_patch.last_quiz_summary,
          next_action_json: body.p_profile_patch.next_action_json,
          recent_badges_json: body.p_profile_patch.recent_badges_json,
          chapters_mastered_count: body.p_profile_patch.chapters_mastered_count
        }
      });
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  }, async function () {
    const response = await handleChapterQuizRequest({
      method: "POST",
      headers: {
        authorization: "Bearer access-token"
      },
      body: {
        quizKey: "cap02",
        chapterId: "02",
        attemptType: "full_quiz",
        answers: [
          { questionId: "cap02-q1", choice: "b" },
          { questionId: "cap02-q2", choice: "b" },
          { questionId: "cap02-q3", choice: "b" },
          { questionId: "cap02-q4", choice: "a" },
          { questionId: "cap02-q5", choice: "b" }
        ],
        startedAt: "2026-07-16T10:00:00.000Z",
        completedAt: "2026-07-16T10:05:00.000Z"
      },
      env: {
        ...BASE_ENV,
        TERMO_GAMIFICATION_RPC_MODE: "true"
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.attempt.id, "attempt-123");
    assert.equal(response.body.result.score, 100);
    assert.equal(response.body.profile.lastQuizResult.score, 100);
    assert.equal(response.body.profile.lastQuizResult.isMastered, true);
    assert.equal(response.body.profile.lastQuizResult.isExcellent, true);
    assert.equal(response.body.nextAction.type, "next_chapter_quiz");
  });

  assert.equal(calls.some(function (call) {
    return call.url.includes("/rest/v1/rpc/record_chapter_quiz_attempt_atomic");
  }), true);
  assert.equal(calls.some(function (call) {
    return call.url === "https://example.supabase.co/rest/v1/chapter_quiz_attempts" && call.method === "POST";
  }), false);
});

test("profile maps recent quiz attempts into mastery progress", async function () {
  const user = { id: "user-profile", email: "mario@example.com" };
  const profileRow = {
    ...buildDefaultProfileRow(user.id),
    user_id: user.id,
    xp_total: 70
  };

  await withMockedFetch(async function (url) {
    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse(user);
    }

    if (String(url).includes("/rest/v1/gamification_profiles")) {
      return createJsonResponse([profileRow]);
    }

    if (String(url).includes("/rest/v1/chapter_quiz_attempts")) {
      return createJsonResponse([
        {
          quiz_key: "cap02",
          chapter_id: "02",
          attempt_type: "full_quiz",
          score: 80,
          correct_count: 4,
          question_count: 5,
          xp_awarded: 45,
          completed_at: "2026-07-16T10:05:00.000Z"
        },
        {
          quiz_key: "cap04",
          chapter_id: "04",
          attempt_type: "full_quiz",
          score: 60,
          correct_count: 3,
          question_count: 5,
          xp_awarded: 30,
          completed_at: "2026-07-16T11:05:00.000Z"
        }
      ]);
    }

    if (String(url).includes("/rest/v1/gamification_item_progress")) {
      return createJsonResponse([
        {
          chapter_id: "04",
          item_id: "4.4",
          item_key: "04:4.4",
          status: "studied",
          completed_at: "2026-07-17T10:10:00.000Z"
        },
        {
          chapter_id: "02",
          item_id: "2.4",
          item_key: "02:2.4",
          status: "studied",
          completed_at: "2026-07-16T10:10:00.000Z"
        }
      ]);
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  }, async function () {
    const response = await handleGamificationProfileRequest({
      method: "GET",
      headers: {
        authorization: "Bearer access-token"
      },
      env: BASE_ENV
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.summary.chaptersMasteredCount, 1);
    assert.equal(response.body.featureFlags.masteryScore, 80);
    assert.equal(response.body.chapterProgress.length, 2);
    assert.equal(response.body.chapterProgress.find((item) => item.chapterId === "02").mastered, true);
    assert.equal(response.body.chapterProgress.find((item) => item.chapterId === "02").studiedItems, 1);
    assert.equal(response.body.chapterProgress.find((item) => item.chapterId === "04").status, "review");
    assert.equal(response.body.chapterProgress.find((item) => item.chapterId === "04").studiedItems, 1);
    assert.equal(response.body.recentStudiedItems.length, 2);
    assert.equal(response.body.recentStudiedItems[0].itemId, "4.4");
  });
});

test("guided review grades only the focused review check", async function () {
  const user = { id: "user-review", email: "mario@example.com" };
  const profileRow = {
    ...buildDefaultProfileRow(user.id),
    user_id: user.id,
    xp_total: 30
  };

  await withMockedFetch(async function (url, options = {}) {
    const method = options.method || "GET";

    if (String(url).endsWith("/auth/v1/user")) {
      return createJsonResponse(user);
    }

    if (String(url).includes("/rest/v1/gamification_profiles") && method === "GET") {
      return createJsonResponse([profileRow]);
    }

    if (String(url).includes("/rest/v1/chapter_quiz_attempts") && method === "GET") {
      return createJsonResponse([
        {
          id: "previous-full",
          quiz_key: "cap02",
          chapter_id: "02",
          attempt_type: "full_quiz",
          score: 60
        }
      ]);
    }

    if (String(url).includes("/rest/v1/chapter_quiz_attempts") && method === "POST") {
      const body = JSON.parse(String(options.body || "{}"));
      assert.equal(body.attempt_type, "guided_review");
      assert.equal(body.question_count, 1);
      assert.equal(body.correct_count, 1);
      assert.equal(body.score, 100);
      assert.equal(body.xp_awarded, 10);
      assert.equal(body.answers[0].questionId, "cap02-q1:review");

      return createJsonResponse([{
        id: "review-attempt-1",
        attempt_type: "guided_review",
        score: 100,
        correct_count: 1,
        question_count: 1,
        xp_awarded: 10,
        started_at: body.started_at,
        completed_at: body.completed_at
      }]);
    }

    if (String(url).includes("/rest/v1/gamification_profiles") && method === "PATCH") {
      const body = JSON.parse(String(options.body || "{}"));
      assert.equal(body.xp_total, 40);
      assert.equal(body.next_action_json.type, "retry_full_quiz");

      return createJsonResponse([{
        ...profileRow,
        ...body
      }]);
    }

    throw new Error(`Unexpected fetch URL in test: ${url}`);
  }, async function () {
    const response = await handleChapterQuizRequest({
      method: "POST",
      headers: {
        authorization: "Bearer access-token"
      },
      body: {
        quizKey: "cap02",
        chapterId: "02",
        attemptType: "guided_review",
        answers: [
          { questionId: "cap02-q1:review", choice: "a" }
        ],
        startedAt: "2026-07-16T10:07:00.000Z",
        completedAt: "2026-07-16T10:08:00.000Z"
      },
      env: BASE_ENV
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.attempt.attemptType, "guided_review");
    assert.equal(response.body.attempt.questionCount, 1);
    assert.equal(response.body.attempt.xpAwarded, 10);
    assert.equal(response.body.nextAction.type, "retry_full_quiz");
  });
});
