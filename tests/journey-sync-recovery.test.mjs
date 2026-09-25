import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

function loadJourneyProfileErrorRenderer(topicContainer, renderJourney) {
  const start = indexSource.indexOf("    function renderJourneyProfileLoadError() {");
  const end = indexSource.indexOf("    async function getAuthConfigurationStatus()", start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const source = indexSource.slice(start, end);
  return new Function(
    "topicContainer",
    "renderJourney",
    `${source}\nreturn renderJourneyProfileLoadError;`
  )(topicContainer, renderJourney);
}

test("falha de sincronização da jornada não apresenta um perfil zerado", function () {
  assert.doesNotMatch(
    indexSource,
    /renderJourneyProfile\(buildJourneyFallbackProfile\(""\), simulatorActivityResult\)/
  );
  assert.match(indexSource, /renderJourneyProfileLoadError\(\)/);
  assert.match(indexSource, /Seus dados de estudo não foram alterados\./);
});

test("falha de sincronização oferece nova tentativa acessível", function () {
  assert.match(indexSource, /role="status" aria-live="polite"/);
  assert.match(indexSource, /data-role="retry-journey-profile" type="button"/);
  assert.match(indexSource, /retryButton\.disabled = true/);
  assert.match(indexSource, /await renderJourney\(\)/);
});

test("nova tentativa desabilita o botão e reinicia a jornada", async function () {
  let clickHandler = null;
  let renderCount = 0;
  const retryButton = {
    disabled: false,
    innerHTML: "",
    addEventListener(type, handler) {
      assert.equal(type, "click");
      clickHandler = handler;
    }
  };
  const topicContainer = {
    innerHTML: "",
    querySelector(selector) {
      assert.equal(selector, '[data-role="retry-journey-profile"]');
      return retryButton;
    }
  };
  const renderJourneyProfileLoadError = loadJourneyProfileErrorRenderer(
    topicContainer,
    async function () {
      renderCount += 1;
    }
  );

  renderJourneyProfileLoadError();
  assert.match(topicContainer.innerHTML, /Não foi possível sincronizar seus pontos e simulados agora\./);
  assert.equal(typeof clickHandler, "function");

  await clickHandler();
  assert.equal(retryButton.disabled, true);
  assert.match(retryButton.innerHTML, /Sincronizando\.\.\./);
  assert.equal(renderCount, 1);
});
