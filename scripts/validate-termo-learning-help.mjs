import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, readFile } from "node:fs/promises";
import { buildLearningHelpHtml, validateLearningMethodologySource } from "./build-termo-learning-help.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const source = JSON.parse(await readFile(path.join(rootDir, "data", "termo-learning-methodology-v1.json"), "utf8"));
const html = await readFile(path.join(rootDir, "ajuda-aprendizado.html"), "utf8");
const sitemap = await readFile(path.join(rootDir, "sitemap.xml"), "utf8");
const indexHtml = await readFile(path.join(rootDir, "index.html"), "utf8");

validateLearningMethodologySource(source);

const expected = buildLearningHelpHtml(source);
if (html !== expected) throw new Error("ajuda-aprendizado.html está divergente da fonte metodológica versionada.");

const requiredPatterns = [
  /<html lang="pt-BR">/,
  /<link rel="canonical" href="https:\/\/termo\.app\.br\/ajuda-aprendizado\.html"/,
  /"@type":"FAQPage"/,
  /Versão da metodologia:/,
  /Por que estou vendo esta atividade\?/,
  /Como ganho pontos\?/,
  /O que conta como uso do simulador\?/,
  /Posso escolher outra atividade\?/,
  /href="privacidade\.html"/,
  /mailto:contatos@termo\.app\.br/
];

for (const pattern of requiredPatterns) {
  if (!pattern.test(html)) throw new Error(`Ajuda metodológica não atende ao contrato: ${pattern}.`);
}

if (!sitemap.includes("<loc>https://termo.app.br/ajuda-aprendizado.html</loc>")) {
  throw new Error("Ajuda metodológica ausente do sitemap.");
}

if (!indexHtml.includes('href="ajuda-aprendizado.html"')) {
  throw new Error("Ajuda metodológica ausente do menu público do app.");
}

for (const forbidden of ["service_role", "idempotency_key", "minimumIndependentRetrievals", "xpPerLevel"]) {
  if (html.includes(forbidden)) throw new Error(`Detalhe técnico não deve estar na ajuda pública: ${forbidden}.`);
}

const localLinks = Array.from(html.matchAll(/href="([^"]+)"/g), (match) => match[1])
  .filter((href) => !/^(?:https?:|mailto:|#)/.test(href));
for (const href of localLinks) {
  const [relativePath, fragment] = href.split("#");
  const [filePath] = relativePath.split("?");
  await access(path.join(rootDir, filePath));
  if (fragment) {
    const linkedHtml = await readFile(path.join(rootDir, filePath), "utf8");
    if (!linkedHtml.includes(`id="${fragment}"`)) throw new Error(`Âncora local ausente: ${href}.`);
  }
}

console.log(`Ajuda metodológica validada: versão ${source.version}, ${source.sections.length} seções e ${source.faqs.length} FAQs.`);
