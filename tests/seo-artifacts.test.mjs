import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const rootHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const homeHtml = await readFile(new URL("../home.html", import.meta.url), "utf8");
const sitemapXml = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const searchHtml = await readFile(new URL("../search.html", import.meta.url), "utf8");
const promoVideoStat = await stat(new URL("../assets/videos/termo-apresentacao.mp4", import.meta.url));
const promoPosterStat = await stat(new URL("../assets/videos/termo-apresentacao-poster.png", import.meta.url));
const intentPages = await Promise.all([
  "leis-da-termodinamica.html",
  "exercicios-de-termodinamica.html",
  "simuladores-de-termodinamica.html"
].map(async (file) => ({ file, html: await readFile(new URL(`../${file}`, import.meta.url), "utf8") })));

function matchContent(html, expression, label) {
  const match = html.match(expression);
  assert.ok(match, `${label} ausente`);
  return match[1];
}

function title(html) {
  return matchContent(html, /<title>([^<]+)<\/title>/i, "title");
}

function description(html) {
  return matchContent(html, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?\s*>/i, "meta description");
}

function canonical(html) {
  return matchContent(html, /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/i, "canonical");
}

test("app e home têm intenções de busca e URLs canônicas distintas", function () {
  assert.notEqual(title(rootHtml), title(homeHtml));
  assert.notEqual(description(rootHtml), description(homeHtml));
  assert.equal(canonical(rootHtml), "https://termo-theta.vercel.app/");
  assert.equal(canonical(homeHtml), "https://termo-theta.vercel.app/home.html");
  assert.match(title(rootHtml), /App de Termodinâmica/);
  assert.match(title(homeHtml), /Livro interativo/);
});

test("snippets principais permanecem concisos", function () {
  assert.ok(title(rootHtml).length <= 70);
  assert.ok(title(homeHtml).length <= 70);
  assert.ok(description(rootHtml).length <= 160);
  assert.ok(description(homeHtml).length <= 160);
});

test("dados estruturados conectam TERMO, curso e autor", function () {
  assert.match(rootHtml, /"alternateName":"Termodinâmica para Estudantes de Física"/);
  assert.match(rootHtml, /"@type":"Course"/);
  assert.match(rootHtml, /"sameAs":\[[^\]]*international\.uff\.br/);
  assert.match(homeHtml, /"@type":"WebPage"/);
  assert.match(homeHtml, /"sameAs":\[[^\]]*www\.uff\.br/);
});

test("landing preserva o vídeo de apresentação e seus metadados", function () {
  assert.match(homeHtml, /<video\s+controls\s+playsinline\s+preload="metadata"/);
  assert.doesNotMatch(homeHtml, /<video[^>]+autoplay/i);
  assert.match(homeHtml, /assets\/videos\/termo-apresentacao\.mp4/);
  assert.match(homeHtml, /assets\/videos\/termo-apresentacao-poster\.png/);
  assert.match(homeHtml, /"@type":"VideoObject"/);
  assert.match(homeHtml, /"duration":"PT1M6S"/);
  assert.ok(promoVideoStat.size > 0);
  assert.ok(promoPosterStat.size > 0);
});

test("sitemap lista app e home uma única vez", function () {
  const locations = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  assert.equal(locations.filter((url) => url === "https://termo-theta.vercel.app/").length, 1);
  assert.equal(locations.filter((url) => url === "https://termo-theta.vercel.app/home.html").length, 1);
  assert.equal(new Set(locations).size, locations.length);
  for (const { file } of intentPages) {
    assert.equal(locations.filter((url) => url === `https://termo-theta.vercel.app/${file}`).length, 1);
  }
});

test("páginas de intenção têm metadados, H1 e ligações internas", function () {
  for (const { file, html } of intentPages) {
    assert.equal(canonical(html), `https://termo-theta.vercel.app/${file}`);
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/i);
    assert.match(html, /href="home\.html"/);
    assert.match(html, /href="conteudo\.html/);
    assert.match(html, /href="index\.html/);
    assert.match(html, /application\/ld\+json/);
  }
});

test("busca pública tem canonical, SearchAction e está no sitemap", function () {
  assert.equal(title(searchHtml), "Buscar conteúdo | TERMO");
  assert.equal(canonical(searchHtml), "https://termo-theta.vercel.app/search.html");
  assert.match(searchHtml, /"@type":"SearchAction"/);
  assert.match(searchHtml, /data\/termo-published-search-index\.json/);
  assert.match(sitemapXml, /<loc>https:\/\/termo-theta\.vercel\.app\/search\.html<\/loc>/);
});
