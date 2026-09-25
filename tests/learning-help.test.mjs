import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = JSON.parse(await readFile(new URL("../data/termo-learning-methodology-v1.json", import.meta.url), "utf8"));
const page = await readFile(new URL("../ajuda-aprendizado.html", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const home = await readFile(new URL("../home.html", import.meta.url), "utf8");
const content = await readFile(new URL("../conteudo.html", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");

test("fonte metodologica e versionada e cobre os temas publicos obrigatorios", function () {
  assert.equal(source.schemaVersion, 1);
  assert.match(source.version, /^\d+\.\d+\.\d+$/);
  assert.match(source.updatedAt, /^\d{4}-\d{2}-\d{2}$/);

  const text = JSON.stringify(source);
  for (const expression of [
    /Prática da seção/,
    /Simulado do capítulo/,
    /Desafio do dia/,
    /Simulador/,
    /baixa confiança/,
    /pontos/,
    /domínio/,
    /inteligência artificial/,
    /Privacidade/,
    /relatar um possível erro/i
  ]) {
    assert.match(text, expression);
  }
});

test("pagina publica oferece SEO, acessibilidade e respostas contextuais", function () {
  assert.match(page, /<html lang="pt-BR">/);
  assert.match(page, /<a class="skip-link" href="#conteudo-principal">/);
  assert.match(page, /<link rel="canonical" href="https:\/\/termo\.app\.br\/ajuda-aprendizado\.html"/);
  assert.match(page, /"@type":"FAQPage"/);
  assert.match(page, /Versão da metodologia:/);
  assert.match(page, /Por que estou vendo esta atividade\?/);
  assert.match(page, /Como ganho pontos\?/);
  assert.match(page, /O que conta como uso do simulador\?/);
  assert.match(page, /Posso escolher outra atividade\?/);
});

test("ajuda evita promessas e detalhes tecnicos exploraveis", function () {
  assert.match(page, /não são nota, diagnóstico de capacidade nem prova isolada de aprendizagem/i);
  assert.match(page, /métricas de uso, satisfação, tempo e pontos são avaliadas separadamente/i);
  for (const forbidden of [
    "service_role",
    "idempotency_key",
    "minimumIndependentRetrievals",
    "xpPerLevel",
    "TERMO_GAMIFICATION_LEDGER_V1"
  ]) {
    assert.doesNotMatch(page, new RegExp(forbidden));
  }
});

test("menu, superficies de aprendizagem, landing e mapa ligam para a ajuda", function () {
  assert.match(index, /href="ajuda-aprendizado\.html"/);
  assert.match(index, /href="ajuda-aprendizado\.html#modos"/);
  assert.match(index, /href="ajuda-aprendizado\.html#escolha"/);
  assert.match(home, /href="ajuda-aprendizado\.html"/);
  assert.match(content, /href="ajuda-aprendizado\.html"/);
});

test("ajuda aparece uma unica vez no sitemap canonico", function () {
  const matches = sitemap.match(/<loc>https:\/\/termo\.app\.br\/ajuda-aprendizado\.html<\/loc>/g) || [];
  assert.equal(matches.length, 1);
});
