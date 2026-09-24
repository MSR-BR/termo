import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const authSource = await readFile(new URL("../assets/termo-auth.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

function createResponse(payload, options = {}) {
  return {
    ok: options.ok !== false,
    status: options.status || 200,
    async json() {
      if (options.jsonError) throw options.jsonError;
      return payload;
    }
  };
}

function bootAuth(fetchImplementation) {
  const listeners = new Map();
  const dispatchedEvents = [];
  const window = {
    location: {
      hostname: "termo.app.br",
      origin: "https://termo.app.br",
      pathname: "/index.html",
      search: "",
      hash: "",
      reload() {}
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
      return true;
    }
  };
  const document = {
    readyState: "loading",
    visibilityState: "visible",
    addEventListener(name, callback) {
      listeners.set(`document:${name}`, callback);
    },
    getElementById() { return null; },
    querySelector() { return null; }
  };
  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const context = vm.createContext({
    window,
    document,
    fetch: fetchImplementation,
    CustomEvent,
    MutationObserver: class MutationObserver {},
    URL,
    Promise,
    console
  });
  vm.runInContext(authSource, context);

  return {
    auth: window.TermoAuth,
    dispatchedEvents,
    listeners,
    window
  };
}

test("a falha transitória é repetida e não se torna configuração ausente", async function () {
  const calls = [];
  let attempt = 0;
  const runtime = bootAuth(async function (_url, options) {
    calls.push(options);
    attempt += 1;
    if (attempt === 1) throw new Error("offline temporário");
    return createResponse({ authEnabled: true, supabaseUrl: "https://example.supabase.co" });
  });

  const result = await runtime.auth.getConfigurationStatus();
  assert.equal(result.status, "configured");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].cache, "no-store");
  assert.equal(calls[0].credentials, "same-origin");
});

test("falha esgotada permanece recuperável em uma nova tentativa", async function () {
  let online = false;
  let calls = 0;
  const runtime = bootAuth(async function () {
    calls += 1;
    if (!online) throw new Error("rede indisponível");
    return createResponse({
      authEnabled: true,
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "public-test-key"
    });
  });

  const unavailable = await runtime.auth.getConfigurationStatus();
  assert.equal(unavailable.status, "unavailable");
  assert.equal(calls, 3);

  online = true;
  const recovered = await runtime.auth.retryConfiguration();
  assert.equal(recovered.status, "configured");
  assert.equal(calls, 4);
  assert.ok(runtime.dispatchedEvents.some(function (event) {
    return event.type === "termo-auth-config-change" && event.detail.status === "configured";
  }));
});

test("resposta válida desabilitada continua distinta de falha de carregamento", async function () {
  let calls = 0;
  const runtime = bootAuth(async function () {
    calls += 1;
    return createResponse({ authEnabled: false });
  });

  const first = await runtime.auth.getConfigurationStatus();
  const second = await runtime.auth.getConfigurationStatus();
  assert.equal(first.status, "missing");
  assert.equal(second.status, "missing");
  assert.equal(calls, 1);
  assert.equal(await runtime.auth.isConfigured(), false);
});

test("a interface oferece recuperação sem expor nomes de fornecedores", function () {
  assert.match(indexSource, /data-role="retry-auth-configuration"/);
  assert.match(indexSource, /Não foi possível verificar o login agora\./);
  assert.match(indexSource, /O login não está disponível neste ambiente\./);
  assert.doesNotMatch(indexSource, /Falta configurar as variáveis públicas do Supabase/);
  assert.match(indexSource, /featureLabel: "O acesso a pontos e simulados"/);
  assert.match(indexSource, /featureLabel: "O desafio do dia"/);
  assert.match(indexSource, /featureLabel: "A área Meus exercícios"/);
  assert.match(authSource, /data-termo-auth-config-retry/);
  assert.match(authSource, /Não foi possível verificar o login agora/);
  assert.doesNotMatch(authSource, /Variáveis esperadas:/);
});

test("o retorno por bfcache força revalidação e o host legado recarrega", function () {
  assert.match(authSource, /window\.addEventListener\("pageshow"/);
  assert.match(authSource, /if \(!event\.persisted\) return;/);
  assert.match(authSource, /window\.location\.hostname === "termo-theta\.vercel\.app"/);
  assert.match(authSource, /void retryConfiguration\(\);/);
});
