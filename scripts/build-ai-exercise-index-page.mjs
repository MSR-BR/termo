import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = process.cwd();
const TOPIC_INDEX_PATH = resolve(ROOT_DIR, "data/book-topic-index.json");
const CORPUS_PATH = resolve(ROOT_DIR, "data/book-section-corpus.json");
const OUTPUT_DIR = resolve(ROOT_DIR, "docs");
const OUTPUT_PATH = resolve(OUTPUT_DIR, "exercicios-ia-indice-referencias.html");

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageRange(reference = {}) {
  const start = Number(reference.pageStart || 0) || 0;
  const end = Number(reference.pageEnd || 0) || 0;
  if (!start) return "PDF sem pagina";
  return `PDF p.${start}${end && end !== start ? `-${end}` : ""}`;
}

function formatRefs(references = []) {
  if (!references.length) return "<span class=\"muted\">Sem referencia canonica.</span>";

  return references.map((reference) => `
    <li>
      <strong>${escapeHtml(reference.label || reference.id)}</strong>
      <span>${escapeHtml(pageRange(reference))}</span>
      ${reference.pdfChapterTitle ? `<small>${escapeHtml(reference.pdfChapterTitle)}</small>` : ""}
      ${reference.mappingReason ? `<small>${escapeHtml(reference.mappingReason)}</small>` : ""}
    </li>
  `).join("");
}

function topicBadge(topicId, topicById) {
  const topic = topicById.get(topicId);
  const usage = topic?.usage === "advanced-support" ? "advanced" : "default";
  return `<span class="badge ${usage}">${escapeHtml(topicId)}</span>`;
}

function sectionRow(section, topicById) {
  const refs = section.canonicalReference?.references || [];
  const defaultTopics = (section.transversalTopics || []).map((topicId) => topicBadge(topicId, topicById)).join("");
  const advancedTopics = (section.advancedSupportTopics || []).map((topicId) => topicBadge(topicId, topicById)).join("");

  return `
    <article class="section-card" id="sec-${escapeHtml(section.sectionId)}">
      <div class="card-topline">
        <span>Cap. ${escapeHtml(section.chapterId)} · ${escapeHtml(section.itemId)}</span>
        <a href="../${escapeHtml(section.pagePath)}">Abrir pagina</a>
      </div>
      <h3>${escapeHtml(section.title)}</h3>
      <p><strong>Topico principal:</strong> <code>${escapeHtml(section.primaryTopic)}</code></p>
      <div class="topic-lines">
        <div><strong>Indice transversal padrao</strong>${defaultTopics || "<span class=\"muted\">Nenhum.</span>"}</div>
        <div><strong>Apoio avancado</strong>${advancedTopics || "<span class=\"muted\">Nenhum.</span>"}</div>
      </div>
      <details>
        <summary>Referencias canonicas do PDF</summary>
        <ul>${formatRefs(refs)}</ul>
      </details>
    </article>
  `;
}

function topicSection(topic) {
  const fragments = (topic.fragments || []).map((fragment) => `
    <li>
      <a href="#sec-${escapeHtml(fragment.sectionId)}">${escapeHtml(fragment.sectionId)} · ${escapeHtml(fragment.title)}</a>
      <span>${escapeHtml(pageRange(fragment))}</span>
      <small>${escapeHtml(fragment.relation === "primary-topic" ? "topico principal" : "relacionado")}</small>
    </li>
  `).join("");
  const usage = topic.usage === "advanced-support" ? "Apoio avancado" : "Padrao";

  return `
    <article class="topic-card" id="topic-${escapeHtml(topic.id)}">
      <div class="card-topline">
        <span>${escapeHtml(usage)}</span>
        <span>${escapeHtml(topic.sectionCount)} secoes</span>
      </div>
      <h3>${escapeHtml(topic.label)}</h3>
      <p><code>${escapeHtml(topic.id)}</code></p>
      <ul>${fragments}</ul>
    </article>
  `;
}

function main() {
  if (!existsSync(TOPIC_INDEX_PATH)) {
    throw new Error(`Indice tematico nao encontrado: ${TOPIC_INDEX_PATH}`);
  }
  if (!existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus canonico nao encontrado: ${CORPUS_PATH}`);
  }

  const topicIndex = JSON.parse(readFileSync(TOPIC_INDEX_PATH, "utf8"));
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const topics = Array.isArray(topicIndex.topics) ? topicIndex.topics : [];
  const sections = Array.isArray(topicIndex.sectionIndex) ? topicIndex.sectionIndex : [];
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const generatedAt = new Date().toISOString();

  const principalIndex = sections
    .slice()
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId, "pt-BR", { numeric: true }))
    .map((section) => sectionRow(section, topicById))
    .join("");

  const transversalIndex = topics
    .slice()
    .sort((a, b) => {
      const usageSort = String(a.usage || "default").localeCompare(String(b.usage || "default"));
      return usageSort || a.id.localeCompare(b.id);
    })
    .map(topicSection)
    .join("");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>TERMO · Indice de Exercicios IA e Referencias</title>
  <style>
    :root {
      --blue: #004f8f;
      --red: #b33a32;
      --green: #16824a;
      --ink: #21364d;
      --muted: #5f7186;
      --line: #d9e7f8;
      --wash: #f6f9fd;
      --yellow: #fff8e6;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: linear-gradient(135deg, #eef6ff 0%, #fff 42%, #f7fbf4 100%);
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.45;
    }
    main { width: min(1320px, calc(100vw - 32px)); margin: 32px auto 64px; }
    header, section, .notice {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: 0 22px 60px rgba(0, 79, 143, 0.08);
    }
    header { padding: 30px; }
    .eyebrow {
      color: var(--red);
      font: 800 14px/1.2 system-ui, sans-serif;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    h1, h2, h3 { color: var(--blue); margin: 0; }
    h1 { font: 850 clamp(34px, 6vw, 62px)/1.02 system-ui, sans-serif; margin-top: 8px; }
    h2 { font: 850 clamp(28px, 4vw, 44px)/1.05 system-ui, sans-serif; }
    h3 { font: 850 22px/1.12 system-ui, sans-serif; }
    p { color: var(--muted); font-size: 19px; }
    code {
      background: #eef5ff;
      border: 1px solid #d7e8ff;
      border-radius: 8px;
      color: var(--blue);
      padding: 2px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
    nav a, .card-topline a {
      border: 1px solid #bcd4f5;
      border-radius: 999px;
      color: var(--blue);
      padding: 10px 14px;
      text-decoration: none;
      font: 800 15px/1 system-ui, sans-serif;
      background: #fff;
    }
    .notice {
      margin-top: 22px;
      padding: 22px;
      background: var(--yellow);
      border-color: #f1d38c;
    }
    .notice strong { color: #7a4f00; }
    section { margin-top: 26px; padding: 26px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .summary-card {
      background: var(--wash);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 16px;
      font-family: system-ui, sans-serif;
    }
    .summary-card strong { display: block; color: var(--blue); font-size: 32px; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .section-card, .topic-card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 18px;
    }
    .card-topline {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      color: var(--muted);
      font: 800 12px/1.2 system-ui, sans-serif;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .topic-lines { display: grid; gap: 10px; margin: 14px 0; }
    .topic-lines strong {
      display: block;
      margin-bottom: 6px;
      font: 800 13px/1.2 system-ui, sans-serif;
      text-transform: uppercase;
      color: var(--muted);
    }
    .badge {
      display: inline-block;
      margin: 3px 5px 3px 0;
      border-radius: 999px;
      padding: 7px 10px;
      font: 800 13px/1 system-ui, sans-serif;
      background: #eaf7ef;
      color: #126b3c;
      border: 1px solid #b8e6c6;
    }
    .badge.advanced {
      background: #fff4df;
      color: #855500;
      border-color: #efd09a;
    }
    .muted { color: var(--muted); }
    details {
      border-top: 1px solid var(--line);
      margin-top: 14px;
      padding-top: 12px;
    }
    summary {
      cursor: pointer;
      color: var(--blue);
      font: 850 16px/1.2 system-ui, sans-serif;
    }
    li { margin: 10px 0; }
    li span, li small { display: block; color: var(--muted); }
    .topic-card ul { padding-left: 20px; }
    .topic-card a { color: var(--blue); font-weight: 800; text-decoration: none; }
    @media (max-width: 760px) {
      header, section, .notice { border-radius: 22px; padding: 20px; }
      .card-grid { grid-template-columns: 1fr; }
      .card-topline { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">TERMO · Referencia tecnica</div>
      <h1>Indice de exercicios IA e referencias</h1>
      <p>Este arquivo documenta o mapa entre secoes do app, referencias canonicas do PDF e temas transversais usados para orientar exercicios e simulados por IA.</p>
      <nav>
        <a href="#manutencao">Manutencao obrigatoria</a>
        <a href="#indice-principal">Indice principal por secao</a>
        <a href="#indice-transversal">Indice transversal por tema</a>
      </nav>
    </header>

    <aside class="notice" id="manutencao">
      <div class="eyebrow">Manutencao obrigatoria</div>
      <h2>Atualizar quando o app ou o PDF mudarem</h2>
      <p><strong>Importante:</strong> se o conteudo das paginas HTML do app ou o PDF do livro forem atualizados, este indice deve ser regenerado antes de alterar prompts, exercicios IA ou simulados.</p>
      <p>Fluxo recomendado: <code>npm run extract:book-sections</code>, <code>npm run build:book-topic-index</code>, <code>npm run docs:ai-exercise-index</code>, depois validar com <code>npm run validate:book-corpus</code> e <code>npm run validate:book-topic-index</code>.</p>
    </aside>

    <section>
      <div class="eyebrow">Resumo</div>
      <h2>Estado deste indice</h2>
      <p>Gerado em ${escapeHtml(generatedAt)} a partir de <code>data/book-section-corpus.json</code> e <code>data/book-topic-index.json</code>.</p>
      <div class="summary-grid">
        <div class="summary-card"><strong>${escapeHtml(topicIndex.sectionCount || sections.length)}</strong>secoes do app indexadas</div>
        <div class="summary-card"><strong>${escapeHtml(topicIndex.topicCount || topics.length)}</strong>temas transversais</div>
        <div class="summary-card"><strong>${escapeHtml(corpus.pageCount || "")}</strong>paginas no PDF fonte</div>
      </div>
    </section>

    <section id="indice-principal">
      <div class="eyebrow">Indice principal</div>
      <h2>Secoes do app e referencias canonicas</h2>
      <p>Use este indice para conferir qual trecho do PDF ancora cada exercicio de secao. Os temas em verde sao contexto padrao; os temas em amarelo sao apenas apoio avancado.</p>
      <div class="card-grid">${principalIndex}</div>
    </section>

    <section id="indice-transversal">
      <div class="eyebrow">Indice transversal</div>
      <h2>Temas e fragmentos relacionados</h2>
      <p>Use este indice para revisar quais secoes podem apoiar exercicios mais complexos. Temas marcados como apoio avancado nao devem ser usados automaticamente em exercicios simples.</p>
      <div class="card-grid">${transversalIndex}</div>
    </section>
  </main>
</body>
</html>
`,
    "utf8"
  );

  console.log(OUTPUT_PATH);
}

main();
