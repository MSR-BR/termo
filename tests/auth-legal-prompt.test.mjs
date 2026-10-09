import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../assets/termo-auth.js", import.meta.url), "utf8");
const instrumentedSource = source
  .replace("function openModal() {", "function openModal() { window.__opened += 1; return;")
  .replace(/\}\)\(\);\s*$/, "window.__test = { state, promptForLegalPreferencesIfNeeded, buildPageContext };\n})();");

function createRuntime({ preferences, storage = new Map(), userId = "user-1", fetchFails = false } = {}) {
  const window = {
    __opened: 0,
    location: { hostname: "termo.app.br" },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); }
    }
  };
  const document = {
    readyState: "loading",
    addEventListener() {},
    querySelector() { return null; },
    getElementById() { return null; }
  };
  const context = vm.createContext({
    window,
    document,
    fetch: async function (url) {
      assert.equal(url, "/api/legal-preferences");
      if (fetchFails) throw new Error("offline");
      return { ok: Boolean(preferences), async json() { return preferences; } };
    },
    Promise,
    URL,
    console
  });
  vm.runInContext(instrumentedSource, context);
  window.__test.state.session = { user: { id: userId }, access_token: "test-token" };
  return window;
}

const pendingPreferences = {
  termsCurrentVersion: "terms-v1",
  privacyCurrentVersion: "privacy-v1",
  termsVersion: "",
  privacyVersion: "",
  termsAcceptedAt: "",
  privacyAcknowledgedAt: ""
};

test("pedido legal aparece só na primeira janela para a mesma conta e versões", async function () {
  const storage = new Map();
  const first = createRuntime({ preferences: pendingPreferences, storage });
  await first.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(first.__opened, 1);

  const second = createRuntime({ preferences: pendingPreferences, storage });
  await second.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(second.__opened, 0);
  second.TermoAuth.openModal();
  assert.equal(second.__opened, 1, "o perfil continua acessível por ação explícita");
  assert.equal(storage.size, 1);
});

test("nova versão ou outra conta recebe seu próprio aviso", async function () {
  const storage = new Map();
  const first = createRuntime({ preferences: pendingPreferences, storage });
  await first.__test.promptForLegalPreferencesIfNeeded();

  const newVersion = createRuntime({
    preferences: { ...pendingPreferences, privacyCurrentVersion: "privacy-v2" },
    storage
  });
  await newVersion.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(newVersion.__opened, 1);

  const otherUser = createRuntime({ preferences: pendingPreferences, storage, userId: "user-2" });
  await otherUser.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(otherUser.__opened, 1);
});

test("aceitação vigente e erro na consulta não abrem o modal", async function () {
  const accepted = createRuntime({
    preferences: {
      ...pendingPreferences,
      termsVersion: "terms-v1",
      privacyVersion: "privacy-v1",
      termsAcceptedAt: "2026-10-08T00:00:00Z",
      privacyAcknowledgedAt: "2026-10-08T00:00:00Z"
    }
  });
  await accepted.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(accepted.__opened, 0);

  const failed = createRuntime({ fetchFails: true });
  await failed.__test.promptForLegalPreferencesIfNeeded();
  assert.equal(failed.__opened, 0);
});

test("modal da conta conectada não pede para entrar novamente", function () {
  const runtime = createRuntime({ preferences: pendingPreferences });
  const context = runtime.__test.buildPageContext();
  assert.equal(context.title, "Sua conta e preferências");
  assert.doesNotMatch(context.copy, /Entre com Google/);
});
