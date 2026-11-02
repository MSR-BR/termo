import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = (await readFile(new URL('../assets/termo-auth.js', import.meta.url), 'utf8'))
  .replace(/\}\)\(\);\s*$/, 'window.__test = { state, renderLegalPreferences };\n})();');

function setup({ accepted = false, checked = false, optedIn = false, emailChecked = false, fails = false } = {}) {
  const calls = [];
  let closed = false;
  const elements = {
    '[data-termo-auth-accept-legal]': { checked },
    '[data-termo-auth-email-updates]': { checked: emailChecked },
    '[data-termo-auth-save-legal]': { disabled: false, addEventListener() {} }
  };
  const host = { innerHTML: '', querySelector(selector) { return elements[selector] || null; } };
  const window = { location: { hostname: 'termo.app.br' } };
  const document = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } };
  const context = vm.createContext({ window, document, URL, Promise, console,
    fetch: async (_url, options) => {
      calls.push(JSON.parse(options.body));
      if (fails) return { ok: false };
      return { ok: true, async json() { return { termsAcceptedAt: 'now', privacyAcknowledgedAt: 'now', termsVersion: 't', termsCurrentVersion: 't', privacyVersion: 'p', privacyCurrentVersion: 'p', emailUpdatesOptedIn: emailChecked }; } };
    }
  });
  vm.runInContext(source, context);
  const { state, renderLegalPreferences } = window.__test;
  state.session = { user: { id: 'test' }, access_token: 'test' };
  state.modal = { classList: { remove() { closed = true; } }, setAttribute() {} };
  state.statusNode = { textContent: '', classList: { toggle() {} } };
  renderLegalPreferences(host, { termsAcceptedAt: accepted ? 'now' : '', privacyAcknowledgedAt: accepted ? 'now' : '', termsVersion: 't', termsCurrentVersion: 't', privacyVersion: 'p', privacyCurrentVersion: 'p', emailUpdatesOptedIn: optedIn });
  return { host, state, calls, isClosed: () => closed };
}

test('continuar salva aceite explicitamente marcado e preferência de email antes de fechar', async () => {
  const runtime = setup({ checked: true, emailChecked: false });
  await runtime.host.termoSaveAndContinue();
  assert.deepEqual(runtime.calls, [{ acceptDocuments: true, emailUpdatesOptedIn: false }]);
  assert.equal(runtime.isClosed(), true);
});

test('continuar sem aceite não grava nem presume concordância', async () => {
  const runtime = setup();
  await runtime.host.termoSaveAndContinue();
  assert.equal(runtime.calls.length, 0);
  assert.equal(runtime.isClosed(), true);
});

test('falha ao salvar mantém janela aberta para tentar novamente', async () => {
  const runtime = setup({ checked: true, fails: true });
  await runtime.host.termoSaveAndContinue();
  assert.equal(runtime.isClosed(), false);
  assert.match(runtime.state.statusNode.textContent, /Não foi possível salvar/);
});

test('alteração de email sem aceite não é descartada silenciosamente', async () => {
  const runtime = setup({ emailChecked: true });
  await runtime.host.termoSaveAndContinue();
  assert.equal(runtime.calls.length, 0);
  assert.equal(runtime.isClosed(), false);
  assert.match(runtime.state.statusNode.textContent, /Confirme os documentos/);
});

test('continuar salva mudança de email mesmo com termos já aceitos', async () => {
  const runtime = setup({ accepted: true, checked: true, optedIn: true, emailChecked: false });
  await runtime.host.termoSaveAndContinue();
  assert.deepEqual(runtime.calls, [{ acceptDocuments: false, emailUpdatesOptedIn: false }]);
  assert.equal(runtime.isClosed(), true);
});
