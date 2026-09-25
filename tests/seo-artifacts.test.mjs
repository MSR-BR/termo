import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const rootHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const homeHtml = await readFile(new URL("../home.html", import.meta.url), "utf8");
const sitemapXml = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const robotsTxt = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const editorialRegistry = JSON.parse(await readFile(new URL("../data/termo-editorial-registry.json", import.meta.url), "utf8"));
const searchHtml = await readFile(new URL("../search.html", import.meta.url), "utf8");
const learningHelpHtml = await readFile(new URL("../ajuda-aprendizado.html", import.meta.url), "utf8");
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
  assert.equal(canonical(rootHtml), "https://termo.app.br/");
  assert.equal(canonical(homeHtml), "https://termo.app.br/home.html");
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
  assert.equal(locations.filter((url) => url === "https://termo.app.br/").length, 1);
  assert.equal(locations.filter((url) => url === "https://termo.app.br/home.html").length, 1);
  assert.equal(new Set(locations).size, locations.length);
  for (const { file } of intentPages) {
    assert.equal(locations.filter((url) => url === `https://termo.app.br/${file}`).length, 1);
  }
});

test("sitemap contém somente páginas públicas canônicas existentes", async function () {
  const locations = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  const publicChapters = new Set(editorialRegistry.chapters
    .filter((chapter) => chapter.publicAvailable && chapter.seoEligible)
    .map((chapter) => chapter.chapterId));
  assert.ok(locations.length > 0);
  assert.equal(new Set(locations).size, locations.length);

  for (const location of locations) {
    const url = new URL(location);
    assert.equal(url.origin, "https://termo.app.br");
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
    const relativePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    assert.doesNotMatch(relativePath, /(?:^|\/)(?:source|api)(?:\/|$)|unsubscribe\.html/);
    const chapterId = relativePath.match(/^slides\/capitulo-(\d+)\/page_\d+\.html$/)?.[1];
    if (chapterId) assert.ok(publicChapters.has(chapterId), `${relativePath} não está publicado`);
    const html = await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
    assert.equal(canonical(html), location, `${relativePath} tem canonical diferente do sitemap`);
    assert.match(html, /<meta\s+name="robots"\s+content="index,follow[^\"]*"\s*\/?\s*>/i, `${relativePath} não é indexável`);
  }
});

test("robots aponta ao sitemap canônico e preserva o descadastro fora do rastreamento", function () {
  assert.match(robotsTxt, /^Sitemap: https:\/\/termo\.app\.br\/sitemap\.xml$/m);
  assert.match(robotsTxt, /^Disallow: \/unsubscribe\.html$/m);
  assert.doesNotMatch(sitemapXml, /capitulo-05|\/source\/|\/unsubscribe\.html|termo-theta\.vercel\.app/);
});

test("páginas de intenção têm metadados, H1 e ligações internas", function () {
  for (const { file, html } of intentPages) {
    assert.equal(canonical(html), `https://termo.app.br/${file}`);
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/i);
    assert.match(html, /href="home\.html"/);
    assert.match(html, /href="conteudo\.html/);
    assert.match(html, /href="index\.html/);
    assert.match(html, /application\/ld\+json/);
  }
});

test("busca pública tem canonical, SearchAction e está no sitemap", function () {
  assert.equal(title(searchHtml), "Buscar conteúdo | TERMO");
  assert.equal(canonical(searchHtml), "https://termo.app.br/search.html");
  assert.match(searchHtml, /"@type":"SearchAction"/);
  assert.match(searchHtml, /data\/termo-published-search-index\.json/);
  assert.match(sitemapXml, /<loc>https:\/\/termo\.app\.br\/search\.html<\/loc>/);
  assert.match(searchHtml, /href="conteudo\.html"/);
  assert.match(searchHtml, /href="simuladores-de-termodinamica\.html"/);
});

test("índice dinâmico de simuladores não é anunciado como página indexável", async function () {
  const html = await readFile(new URL("../simulators/index.html", import.meta.url), "utf8");
  assert.match(html, /<meta name="robots" content="noindex,follow"\s*\/>/);
  assert.doesNotMatch(sitemapXml, /<loc>https:\/\/termo\.app\.br\/simulators\/index\.html<\/loc>/);
});

test("ajuda metodológica tem canonical, FAQPage e está no sitemap", function () {
  assert.equal(title(learningHelpHtml), "Ajuda — Como funciona seu aprendizado | TERMO");
  assert.equal(canonical(learningHelpHtml), "https://termo.app.br/ajuda-aprendizado.html");
  assert.match(learningHelpHtml, /"@type":"FAQPage"/);
  assert.match(learningHelpHtml, /Versão da metodologia:/);
  assert.match(sitemapXml, /<loc>https:\/\/termo\.app\.br\/ajuda-aprendizado\.html<\/loc>/);
});
