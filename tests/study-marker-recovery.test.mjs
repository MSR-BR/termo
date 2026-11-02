import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = (await readFile(new URL('../assets/termo-auth.js', import.meta.url), 'utf8'))
  .replace(/\}\)\(\);\s*$/, 'window.__test = { state, markCurrentItemStudied, updateStudyMarkerButton };\n})();');
function setup(responses, initial = {}) {
  const values = new Map(Object.entries(initial));
  const requests = [];
  const events = [];
  const attrs = new Map();
  const button = { hidden: false, disabled: false, innerHTML: '', classList: { toggle() {} }, setAttribute(k,v) { attrs.set(k,v); }, getAttribute(k) { return attrs.get(k) || null; } };
  const window = { location: { hostname: 'termo.app.br', pathname: '/slides/capitulo-01/page_2.html', search: '', hash: '' },
    localStorage: { getItem(k) { return values.get(k) || null; }, setItem(k,v) { values.set(k,v); } },
    setTimeout() { return 1; }, clearTimeout() {}, dispatchEvent(event) { events.push(event.detail); } };
  const document = { readyState: 'loading', title: 'Teste', addEventListener() {}, getElementById() { return null; }, querySelector(s) { return s === '.chapter-label' ? { textContent: 'Capítulo 1 · Item 1.1' } : null; } };
  const context = vm.createContext({ window, document, URL, Promise, console, CustomEvent: class { constructor(_name, options) { this.detail = options.detail; } },
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); const result = responses.shift(); return { ok: result.ok, status: result.status, async json() { return result.body; } }; } });
  vm.runInContext(source, context);
  window.__test.state.session = { user: { id: 'test-user' }, access_token: 'test-token' };
  window.__test.state.studyMarkerButton = button;
  return { ...window.__test, requests, events, values, button };
}
const item = { chapterId: '01', itemId: '1.1', title: 'Teste', pagePath: '/slides/capitulo-01/page_2.html' };

test('marca somente local como pendente e confirma no servidor depois', async () => {
  const rt = setup([{ ok:false, status:500, body:{error:'Gamificacao ainda nao configurada.'} }, { ok:true, status:200, body:{ok:true,persisted:true,awarded:true,xpDelta:20} }]);
  await rt.markCurrentItemStudied(null);
  rt.updateStudyMarkerButton(item);
  assert.match(rt.button.innerHTML, /Confirmar estudo salvo/);
  assert.equal(rt.events[0].localOnly, true);
  await rt.markCurrentItemStudied(null);
  assert.equal(rt.requests.length, 2);
  assert.equal(rt.requests[0].idempotencyKey, rt.requests[1].idempotencyKey);
  rt.updateStudyMarkerButton(item);
  assert.match(rt.button.innerHTML, /Estudado/);
  assert.doesNotMatch(rt.button.innerHTML, /Confirmar/);
  assert.equal(rt.events[1].xpDelta, 20);
});

test('marcador antigo é verificável e resposta duplicada não soma pontos novamente', async () => {
  const rt = setup([{ ok:true, status:200, body:{ok:true,persisted:true,deduped:true,awarded:true,xpDelta:20} }], {'termoStudyMarkersV1:test-user': JSON.stringify({'01:1.1':{markedAt:'old'}})});
  rt.updateStudyMarkerButton(item);
  assert.match(rt.button.innerHTML, /Confirmar estudo salvo/);
  await rt.markCurrentItemStudied(null);
  assert.equal(rt.requests.length, 1);
  assert.equal(rt.events[0].xpDelta, 0);
  assert.equal(rt.events[0].awarded, false);
  await rt.markCurrentItemStudied(null);
  assert.equal(rt.requests.length, 1);
});

test('erro de rede mantém marcador pendente para nova tentativa', async () => {
  const rt = setup([{ ok:false, status:500, body:{error:'Gamificacao ainda nao configurada.'} }, { ok:false, status:503, body:{error:'temporario'} }]);
  await rt.markCurrentItemStudied(null);
  await rt.markCurrentItemStudied(null);
  rt.updateStudyMarkerButton(item);
  assert.match(rt.button.innerHTML, /Confirmar estudo salvo/);
});
