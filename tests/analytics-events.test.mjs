import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const analyticsSource = await readFile(new URL("../assets/termo-analytics.js", import.meta.url), "utf8");
const authSource = await readFile(new URL("../assets/termo-auth.js", import.meta.url), "utf8");
const exercisesSource = await readFile(new URL("../assets/ai-exercises.js", import.meta.url), "utf8");

function bootAnalytics(options = {}) {
  const pageUrl = new URL(options.href || "https://termo.app.br/home.html?utm_source=raw-value&utm_campaign=private-campaign");
  const localValues = new Map();
  const sessionValues = new Map();
  const documentListeners = new Map();
  class MockElement {
    constructor(link = null) { this.link = link; }
    closest(selector) { return selector === "a[href]" ? this.link : null; }
  }
  const storage = function (values) {
    return {
      getItem(key) { return values.get(key) || null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); }
    };
  };
  const window = {
    location: {
      href: pageUrl.href,
      origin: pageUrl.origin,
      host: pageUrl.host,
      pathname: pageUrl.pathname
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
  if (options.session) {
    window.TermoAuth = {
      getSession() { return Promise.resolve(options.session); }
    };
  }
  if (options.pendingLogin) sessionValues.set("termo_auth_login_pending_v1", "1");
  if (options.previousLoginUserId) sessionValues.set("termo_analytics_login_" + options.previousLoginUserId, "1");
  const document = {
    referrer: options.referrer || "",
    readyState: "complete",
    visibilityState: "visible",
    head: { appendChild() {} },
    createElement() { return { setAttribute() {} }; },
    querySelector() { return null; },
    addEventListener(name, listener) { documentListeners.set(name, listener); }
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
    Element: MockElement,
    fetch: async function () { return { ok: true, json: async function () { return {}; } }; }
  });
  vm.runInContext(analyticsSource, context);
  return { window, localValues, sessionValues, documentListeners, MockElement };
}

function flushPromises() {
  return new Promise(function (resolve) { setImmediate(resolve); });
}

function googleEvents(window) {
  return Array.from(window.dataLayer)
    .filter(function (entry) { return entry[0] === "event"; })
    .map(function (entry) { return { name: entry[1], properties: entry[2] }; });
}

test("GA4 page view excludes OAuth return data and retains campaign attribution", function () {
  const href = "https://termo.app.br/home.html?code=one-time-code&state=oauth-state&utm_source=google&utm_medium=cpc&gclid=ad-click-id&unknown=private-value#access_token=private-token";
  const runtime = bootAnalytics({ href });
  const config = Array.from(runtime.window.dataLayer).find(function (entry) { return entry[0] === "config"; });
  assert.equal(config[1], "G-NHEVHE096H");
  assert.equal(config[2].page_location, "https://termo.app.br/home.html?utm_source=google&utm_medium=cpc&gclid=ad-click-id");
  assert.equal(runtime.window.location.href, href);
});

test("GA4 page view excludes personal values even in campaign parameters", function () {
  const runtime = bootAnalytics({ href: "https://termo.app.br/index.html?view=chapters&utm_campaign=person%40example.com&utm_source=google&code=temporary" });
  const config = Array.from(runtime.window.dataLayer).find(function (entry) { return entry[0] === "config"; });
  assert.equal(config[2].page_location, "https://termo.app.br/index.html?view=chapters&utm_source=google");
});

test("same-site OAuth referrer is cleaned before GA4 receives it", function () {
  const runtime = bootAnalytics({ referrer: "https://termo.app.br/index.html?code=one-time-code&view=journey#access_token=private-token" });
  const config = Array.from(runtime.window.dataLayer).find(function (entry) { return entry[0] === "config"; });
  assert.equal(config[2].page_referrer, "https://termo.app.br/index.html?view=journey");
});

test("landing app links emit one open event and the mobile CTA emits its own event", function () {
  const runtime = bootAnalytics();
  const link = {
    textContent: "Começar a estudar",
    getAttribute(name) { return name === "href" ? "index.html?view=chapters" : null; },
    classList: { contains(name) { return name === "mobile-study-cta"; } }
  };
  runtime.documentListeners.get("click")({ target: new runtime.MockElement(link) });
  const events = googleEvents(runtime.window);
  assert.deepEqual(events.map(function (event) { return event.name; }), ["termo_open_app", "home_study_cta_click"]);
  assert.equal(events[0].properties.destination_path, "/index.html?view=chapters");
});

test("app-open event does not forward transient parameters from a landing link", function () {
  const runtime = bootAnalytics();
  const link = {
    textContent: "Abrir app",
    getAttribute(name) { return name === "href" ? "index.html?view=chapters&code=temporary" : null; },
    classList: { contains() { return false; } }
  };
  runtime.documentListeners.get("click")({ target: new runtime.MockElement(link) });
  const events = googleEvents(runtime.window);
  assert.deepEqual(events.map(function (event) { return event.name; }), ["termo_open_app"]);
  assert.equal(events[0].properties.destination_path, "/index.html?view=chapters");
});

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

test("opening a chapter page records one study activation", async function () {
  const runtime = bootAnalytics({ href: "https://termo.app.br/slides/capitulo-01/page_2.html" });
  await flushPromises();
  assert.deepEqual(googleEvents(runtime.window).map(function (event) { return event.name; }), ["chapter_start", "study_activation"]);
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
  assert.match(analyticsSource, /"rating_submitted"/);
});

test("GA4 payload excludes direct identifiers and raw custom UTM parameters", function () {
  assert.match(analyticsSource, /SENSITIVE_PROPERTY_NAME_PATTERN/);
  assert.match(analyticsSource, /\{ user_id: _userId, session_id: _sessionId, \.\.\.anonymousContext \}/);
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
  assert.equal(login.properties.session_id, undefined);
  assert.equal(login.properties.utm_source, undefined);
  assert.equal(login.properties.utm_campaign, undefined);
});

test("rating outcome reaches GA4 without free-text feedback", function () {
  const runtime = bootAnalytics();
  runtime.window.TermoAnalytics.track("rating_submitted", {
    rating: 5,
    has_feedback: true,
    feedback: "Texto livre que não pode sair do fluxo de avaliação"
  });
  const rating = googleEvents(runtime.window).find(function (event) { return event.name === "rating_submitted"; });
  assert.equal(rating.properties.rating, 5);
  assert.equal(rating.properties.has_feedback, true);
  assert.equal(rating.properties.feedback, undefined);
  assert.equal(rating.properties.session_id, undefined);
});

test("OAuth return emits login success once, while a restored session does not", async function () {
  const session = { access_token: "access-token", user: { id: "user-123" } };
  const oauthReturn = bootAnalytics({ session, pendingLogin: true, previousLoginUserId: "user-123" });
  await flushPromises();
  assert.equal(googleEvents(oauthReturn.window).filter(function (event) { return event.name === "login_success"; }).length, 1);
  assert.equal(oauthReturn.sessionValues.has("termo_auth_login_pending_v1"), false);

  const restoredSession = bootAnalytics({ session });
  await flushPromises();
  assert.equal(googleEvents(restoredSession.window).filter(function (event) { return event.name === "login_success"; }).length, 0);
});

test("Google OAuth records and clears the pending-login marker on failure", function () {
  assert.match(authSource, /sessionStorage\.setItem\(LOGIN_PENDING_KEY, "1"\)/);
  assert.match(authSource, /sessionStorage\.removeItem\(LOGIN_PENDING_KEY\)/);
});
