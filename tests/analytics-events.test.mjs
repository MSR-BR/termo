import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const analyticsSource = await readFile(new URL("../assets/termo-analytics.js", import.meta.url), "utf8");
const exercisesSource = await readFile(new URL("../assets/ai-exercises.js", import.meta.url), "utf8");

function bootAnalytics() {
  const localValues = new Map();
  const sessionValues = new Map();
  const storage = function (values) {
    return {
      getItem(key) { return values.get(key) || null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); }
    };
  };
  const window = {
    location: {
      href: "https://termo.app.br/home.html?utm_source=raw-value&utm_campaign=private-campaign",
      host: "termo.app.br",
      pathname: "/home.html"
    },
    localStorage: storage(localValues),
    sessionStorage: storage(sessionValues),
    crypto: { randomUUID() { return "anonymous-session"; } },
    screen: { width: 390, height: 844 },
    setTimeout() { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    addEventListener() {}
  };
  const document = {
    referrer: "",
    readyState: "complete",
    visibilityState: "visible",
    head: { appendChild() {} },
    createElement() { return { setAttribute() {} }; },
    querySelector() { return null; },
    addEventListener() {}
  };
  const context = vm.createContext({
    window,
    document,
    navigator: { language: "pt-BR" },
    URL,
    URLSearchParams,
    Intl,
    Date,
    Math,
    Element: class Element {},
    fetch: async function () { return { ok: true, json: async function () { return {}; } }; }
  });
  vm.runInContext(analyticsSource, context);
  return { window, localValues };
}

function googleEvents(window) {
  return Array.from(window.dataLayer)
    .filter(function (entry) { return entry[0] === "event"; })
    .map(function (entry) { return { name: entry[1], properties: entry[2] }; });
}

test("study activation accepts only real study outcomes", function () {
  assert.match(
    analyticsSource,
    /STUDY_ACTIVATION_SOURCES\s*=\s*new Set\(\["chapter_start", "exercise_generate_success"\]\)/
  );
  assert.match(analyticsSource, /if \(!STUDY_ACTIVATION_SOURCES\.has\(sourceEvent\)\) return;/);
  assert.doesNotMatch(analyticsSource, /trackActivation\("exercise_start"/);
  assert.doesNotMatch(analyticsSource, /trackActivation\("simulator_start"/);
  assert.match(exercisesSource, /trackActivationAnalytics\("exercise_generate_success"/);
});

test("only chapter start and successful exercise generation emit study activation", function () {
  const simulator = bootAnalytics();
  simulator.window.TermoAnalytics.trackActivation("simulator_start", { simulator_id: "S01" });
  assert.deepEqual(googleEvents(simulator.window).map(function (event) { return event.name; }), ["simulator_start"]);

  const exerciseStart = bootAnalytics();
  exerciseStart.window.TermoAnalytics.trackActivation("exercise_start", { difficulty: "medium" });
  assert.deepEqual(googleEvents(exerciseStart.window).map(function (event) { return event.name; }), ["exercise_start"]);

  const chapter = bootAnalytics();
  chapter.window.TermoAnalytics.trackActivation("chapter_start", { chapter_id: "01" });
  assert.deepEqual(googleEvents(chapter.window).map(function (event) { return event.name; }), ["chapter_start", "study_activation"]);

  const generated = bootAnalytics();
  generated.window.TermoAnalytics.trackActivation("exercise_generate_success", { difficulty: "medium" });
  assert.deepEqual(googleEvents(generated.window).map(function (event) { return event.name; }), ["exercise_generate_success", "study_activation"]);
});

test("study activation is deduplicated for thirty minutes", function () {
  const runtime = bootAnalytics();
  runtime.window.TermoAnalytics.trackActivation("chapter_start", { chapter_id: "01" });
  runtime.window.TermoAnalytics.trackActivation("exercise_generate_success", { difficulty: "medium" });
  assert.equal(googleEvents(runtime.window).filter(function (event) { return event.name === "study_activation"; }).length, 1);
});

test("funnel outcomes are forwarded to GA4", function () {
  assert.match(analyticsSource, /"exercise_generate_success",\s*\n\s*"login_success"/);
  assert.match(analyticsSource, /"home_study_cta_click"/);
  assert.match(analyticsSource, /"chapter_start"/);
  assert.match(analyticsSource, /"simulator_start"/);
});

test("GA4 payload excludes direct identifiers and raw custom UTM parameters", function () {
  assert.match(analyticsSource, /SENSITIVE_PROPERTY_NAME_PATTERN/);
  assert.match(analyticsSource, /\{ user_id: _userId, \.\.\.anonymousContext \}/);
  assert.doesNotMatch(analyticsSource, /utm_source:\s*getUtm/);
  assert.doesNotMatch(analyticsSource, /utm_medium:\s*getUtm/);
  assert.doesNotMatch(analyticsSource, /utm_campaign:\s*getUtm/);
  assert.doesNotMatch(analyticsSource, /utm_content:\s*getUtm/);

  const runtime = bootAnalytics();
  runtime.window.TermoAnalytics.track("login_success", {
    email: "student@example.com",
    full_name: "Student Name",
    user_id: "user-123",
    access_token: "secret",
    safe_stage: "authenticated"
  });
  const login = googleEvents(runtime.window).find(function (event) { return event.name === "login_success"; });
  assert.equal(login.properties.safe_stage, "authenticated");
  assert.equal(login.properties.email, undefined);
  assert.equal(login.properties.full_name, undefined);
  assert.equal(login.properties.user_id, undefined);
  assert.equal(login.properties.access_token, undefined);
  assert.equal(login.properties.utm_source, undefined);
  assert.equal(login.properties.utm_campaign, undefined);
});
