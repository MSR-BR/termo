import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRootDir = path.resolve(__dirname, "..");
const SITE_URL = "https://termo.app.br";
const AUTHOR_NAME = "Prof. Mario Reis";
const PUBLISHER_NAME = "Instituto de Física — Universidade Federal Fluminense";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDatePt(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || "");
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function validateLearningMethodologySource(source) {
  if (!source || typeof source !== "object") throw new Error("Fonte metodológica ausente.");
  if (source.schemaVersion !== 1) throw new Error("schemaVersion metodológica incompatível.");
  for (const field of ["version", "updatedAt", "title", "description", "policyRef"]) {
    if (!String(source[field] || "").trim()) throw new Error(`Campo metodológico obrigatório ausente: ${field}.`);
  }
  if (!Array.isArray(source.sections) || source.sections.length < 8) throw new Error("A fonte metodológica precisa cobrir as seções públicas obrigatórias.");
  if (!Array.isArray(source.faqs) || source.faqs.length < 4) throw new Error("A fonte metodológica precisa conter as quatro respostas contextuais.");
  if (!Array.isArray(source.references) || source.references.length < 3) throw new Error("Referências metodológicas insuficientes.");

  const sectionIds = new Set();
  for (const section of source.sections) {
    if (!section.id || !section.title) throw new Error("Seção metodológica sem id ou título.");
    if (sectionIds.has(section.id)) throw new Error(`ID metodológico duplicado: ${section.id}.`);
    sectionIds.add(section.id);
  }
}

function buildSection(section) {
  const paragraphs = (section.paragraphs || [])
    .map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
  const items = Array.isArray(section.items) && section.items.length
    ? `\n        <ul class="help-items">\n${section.items.map((item) => [
        "          <li>",
        `            <strong>${escapeHtml(item.title)}</strong>`,
        `            <span>${escapeHtml(item.text)}</span>`,
        "          </li>"
      ].join("\n")).join("\n")}\n        </ul>`
    : "";
  const links = Array.isArray(section.links) && section.links.length
    ? `\n        <div class="help-actions">\n${section.links.map((link) => `          <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("\n")}\n        </div>`
    : "";

  return [
    `      <section class="help-card" id="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-title">`,
    `        <p class="help-eyebrow">${escapeHtml(section.eyebrow || "Metodologia")}</p>`,
    `        <h2 id="${escapeHtml(section.id)}-title">${escapeHtml(section.title)}</h2>`,
    paragraphs,
    items,
    links,
    "      </section>"
  ].filter(Boolean).join("\n");
}

export function buildLearningHelpHtml(source) {
  validateLearningMethodologySource(source);

  const pageUrl = `${SITE_URL}/ajuda-aprendizado.html`;
  const faqEntities = source.faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer }
  }));
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Ajuda — ${source.title}`,
      description: source.description,
      url: pageUrl,
      inLanguage: "pt-BR",
      dateModified: source.updatedAt,
      isPartOf: {
        "@type": "Course",
        name: "Termodinâmica para Estudantes de Física",
        url: `${SITE_URL}/`
      },
      author: { "@type": "Person", name: AUTHOR_NAME },
      publisher: { "@type": "CollegeOrUniversity", name: PUBLISHER_NAME }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntities
    }
  ];

  const toc = source.sections
    .map((section) => `        <a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`)
    .join("\n");
  const sectionMarkup = source.sections.map(buildSection).join("\n");
  const faqMarkup = source.faqs.map((faq) => [
    "        <details>",
    `          <summary>${escapeHtml(faq.question)}</summary>`,
    `          <p>${escapeHtml(faq.answer)}</p>`,
    "        </details>"
  ].join("\n")).join("\n");
  const referenceMarkup = source.references.map((reference) => [
    "        <li>",
    `          <a href="${escapeHtml(reference.href)}" rel="noopener noreferrer">${escapeHtml(reference.authors)} (${escapeHtml(reference.year)}). ${escapeHtml(reference.title)}.</a>`,
    "        </li>"
  ].join("\n")).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ajuda — Como funciona seu aprendizado | TERMO</title>
  <meta name="description" content="${escapeHtml(source.description)}" />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${pageUrl}" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="TERMO" />
  <meta property="og:title" content="Ajuda — Como funciona seu aprendizado | TERMO" />
  <meta property="og:description" content="${escapeHtml(source.description)}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Ajuda — Como funciona seu aprendizado | TERMO" />
  <meta name="twitter:description" content="${escapeHtml(source.description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&amp;family=Lora:wght@400;600&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/termo-learning-help.css?v=${escapeHtml(source.version)}" />
  <script defer src="assets/termo-analytics.js?v=0922.1"></script>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <a class="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
  <main class="help-page" id="conteudo-principal">
    <nav class="help-nav" aria-label="Acessos principais">
      <a href="home.html">Apresentação</a>
      <a href="index.html">Abrir app</a>
      <a href="index.html?view=journey">Pontos e simulados</a>
      <a href="conteudo.html">Mapa de conteúdo</a>
    </nav>

    <header class="help-hero">
      <p class="help-kicker">Ajuda metodológica</p>
      <h1>${escapeHtml(source.title)}</h1>
      <p class="help-lead">${escapeHtml(source.description)}</p>
      <p class="help-version"><strong>Versão da metodologia:</strong> ${escapeHtml(source.version)} · <strong>Atualizada em:</strong> ${escapeHtml(formatDatePt(source.updatedAt))}</p>
    </header>

    <nav class="help-toc" aria-label="Nesta página">
${toc}
      <a href="#perguntas">Perguntas frequentes</a>
      <a href="#referencias">Referências acadêmicas</a>
    </nav>

    <div class="help-grid">
${sectionMarkup}
    </div>

    <section class="help-faq" id="perguntas" aria-labelledby="perguntas-title">
      <p class="help-eyebrow">Respostas rápidas</p>
      <h2 id="perguntas-title">Perguntas frequentes</h2>
${faqMarkup}
    </section>

    <section class="help-references" id="referencias" aria-labelledby="referencias-title">
      <p class="help-eyebrow">Base metodológica</p>
      <h2 id="referencias-title">Referências acadêmicas</h2>
      <p>Estas referências orientam princípios como recuperação ativa, espaçamento e feedback. Elas não garantem, por si sós, que uma mecânica específica melhore a aprendizagem de toda pessoa.</p>
      <ol>
${referenceMarkup}
      </ol>
      <p class="help-note"><strong>Importante:</strong> métricas de uso, satisfação, tempo e pontos são avaliadas separadamente de evidências de aprendizagem.</p>
    </section>

    <footer class="help-footer">
      <p>Esta página explica o método de estudo do TERMO. Para regras jurídicas e tratamento de dados, consulte os <a href="termos.html">Termos de Uso</a> e a <a href="privacidade.html">Política de Privacidade</a>.</p>
    </footer>
  </main>
</body>
</html>
`;
}

export async function buildLearningHelpArtifact(rootDir = defaultRootDir) {
  const sourcePath = path.join(rootDir, "data", "termo-learning-methodology-v1.json");
  const outputPath = path.join(rootDir, "ajuda-aprendizado.html");
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const html = buildLearningHelpHtml(source);
  await writeFile(outputPath, html, "utf8");
  return { sourcePath, outputPath, source, html };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = await buildLearningHelpArtifact();
  console.log(`Ajuda metodológica gerada: ${path.relative(defaultRootDir, result.outputPath)}`);
}
