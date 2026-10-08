// Optional browser regression: requires Playwright installed in the workspace.
// All APIs and external resources are intercepted. No real users or emails.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const actions = [];
let audienceMode = "success";
page.on("pageerror", error => errors.push(error.message));
await page.addInitScript(() => {
  window.TermoAuth = {
    getSession: async () => ({ access_token: "fixture-only", user: { id: "admin-fixture", email: "marioreis@id.uff.br" } }),
    fetchConfig: async () => ({ authEnabled: true, validatorEmails: ["marioreis@id.uff.br"] }),
    getConfigurationStatus: async () => ({ status: "configured" }),
    whenReady: async () => true,
    isConfigured: async () => true
  };
});
await page.route("**/*", async route => {
  const url = new URL(route.request().url());
  if (url.hostname !== "termo.test") return route.abort();
  if (url.pathname === "/api/email-campaign") {
    const payload = route.request().postDataJSON();
    actions.push(payload.action);
    assert.equal(payload.action, "audience", "browser test must never send emails");
    return route.fulfill({ status: audienceMode === "error" ? 502 : 200, json: audienceMode === "error"
      ? { error: "Falha simulada de consulta" }
      : { recipients: audienceMode === "empty" ? [] : [{ id: "fixture-1", email: "teste@example.invalid" }], excludedByFrequencyCap: 0,
        consentSummary: { available: true, optedIn: 2, pendingLegal: 1, paused: 0, limited: false } } });
  }
  if (url.pathname === "/api/learning-evaluation-report") return route.fulfill({ json: {
    window: { days: 28 }, privacy: { minimumCellSize: 5 },
    learning: { attempts: { display: "<5" }, averageObservedScore: null,
      exactOutcome: "Desempenho observado em tentativas registradas; não é uma estimativa causal de aprendizagem.",
      claimGate: "Sem baseline, recuperação tardia e forma alterada, o TERMO descreve experiência e desempenho observado, não ganho de aprendizagem." },
    fidelity: { exactOutcome: "Cobertura observável das etapas; lacunas aparecem como indisponíveis.",
      mechanics: [{ label: "Marcar seção como estudada", stages: { eligibility: { status: "observed", count: { display: "<5" } }, exposure: { status: "unavailable" } } }] },
    dataQuality: { sources: { source_with_long_unbroken_name_for_testing: { ok: true, rows: 2, truncated: false } }, limitations: ["Dados de teste, sem pessoas reais."] }
  } });
  if (url.pathname.startsWith("/api/")) return route.fulfill({ json: {} });
  if (/termo-(user-data|rating|analytics|share)\.js/.test(url.pathname)) return route.fulfill({ contentType: "text/javascript", body: "" });
  const target = path.resolve(root, `.${url.pathname}`);
  if (!target.startsWith(root) || !/\.(html|js|css|json|png|svg|webp|jpg)$/.test(target)) return route.abort();
  try {
    const body = await readFile(target);
    const ext = path.extname(target);
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
    return route.fulfill({ body, contentType: types[ext] || "application/octet-stream" });
  } catch { return route.fulfill({ status: 404, body: "Not found" }); }
});

try {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://termo.test/index.html?view=learning-evaluation");
    await page.locator(".evaluation-table-wrap").first().waitFor();
    const layout = await page.evaluate(() => ({
      viewport: innerWidth, document: document.documentElement.scrollWidth,
      cards: [...document.querySelectorAll(".evaluation-section")].map(x => ({ left: x.getBoundingClientRect().left, right: x.getBoundingClientRect().right })),
      tables: [...document.querySelectorAll(".evaluation-table-wrap")].map(x => ({ width: x.clientWidth, scroll: x.scrollWidth }))
    }));
    assert.ok(layout.document <= width + 1, JSON.stringify(layout));
    assert.ok(layout.cards.every(x => x.left >= 0 && x.right <= width + 1), JSON.stringify(layout));
    const table = page.locator(".evaluation-table-wrap").first();
    await table.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await table.evaluate(x => document.activeElement === x), true);
    if (width === 390) {
      await page.screenshot({ path: "/private/tmp/termo-t58-mobile.png", fullPage: true });
      assert.ok(layout.tables[0].scroll > layout.tables[0].width);
    }
    console.log(`quality layout ${width}px: passed`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://termo.test/index.html?view=communication");
  const content = page.locator('[data-role="communication-audience-content"]');
  const refresh = page.locator('[data-role="load-communication-audience"]');
  await content.getByText("teste@example.invalid").waitFor();
  assert.match(await content.innerText(), /2 autorização.*1 aguardando/s);
  assert.equal(actions.length, 1, "automatic audience query");
  audienceMode = "error";
  await refresh.click();
  await content.getByText("Não foi possível consultar os destinatários.", { exact: true }).waitFor();
  assert.equal(await content.locator("input").count(), 0);
  await page.locator('[data-role="review-communication-send"]').click();
  assert.equal(await page.locator('[data-role="communication-confirmation"]').isVisible(), false);
  audienceMode = "empty";
  await refresh.click();
  await content.getByText("Nenhum destinatário elegível neste momento.", { exact: true }).waitFor();
  assert.equal(await refresh.isEnabled(), true);
  audienceMode = "success";
  await refresh.click();
  await content.getByText("teste@example.invalid").waitFor();
  await page.locator('[data-role="communication-audience-type"]').selectOption("selected_users");
  await content.locator("input").uncheck();
  await page.locator('[data-role="review-communication-send"]').click();
  assert.equal(await page.locator('[data-role="communication-confirmation"]').isVisible(), false);
  // Text enlargement/reflow without reducing the user's chosen font size.
  await page.goto("http://termo.test/index.html?view=learning-evaluation");
  await page.locator(".evaluation-section").first().waitFor();
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  assert.equal(await page.locator(".evaluation-section").evaluateAll(elements => elements.every(x => x.getBoundingClientRect().right <= innerWidth + 1)), true);
  assert.deepEqual(errors, []);
  console.log("audience: automatic load, retry, empty, failure, selection and no send passed");
} finally {
  await browser.close();
}
