import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const ROOT_DIR = process.cwd();
const TOPIC_INDEX_PATH = resolve(ROOT_DIR, "data/book-topic-index.json");
const OUTPUT_DIR = resolve(ROOT_DIR, "output/pdf/book-reference");
const OUTPUT_PATH = resolve(OUTPUT_DIR, "revisao-temas.html");

const REVIEW_TOPICS = [
  {
    id: "helmholtz",
    reviewQuestion: "As secoes ligadas a Helmholtz reforcam o mesmo potencial sem misturar criterio de Gibbs?"
  },
  {
    id: "gibbs",
    reviewQuestion: "As aparicoes de Gibbs ajudam mesmo na energia livre de Gibbs, ou alguma e apenas nome historico?"
  },
  {
    id: "entropia",
    reviewQuestion: "Tema amplo de apoio avancado: nao deve alimentar exercicios basicos sozinho."
  },
  {
    id: "entropia-termodinamica",
    reviewQuestion: "Estas secoes devem ficar juntas para entropia termodinamica, sem puxar entropia microscopica em exercicios basicos."
  },
  {
    id: "entropia-estatistica",
    reviewQuestion: "Estas secoes devem ficar separadas da entropia termodinamica basica."
  },
  {
    id: "gas-ideal",
    reviewQuestion: "Tema amplo de apoio: em 4.1, por exemplo, gas ideal serve como comparacao, nao como assunto central."
  },
  {
    id: "gas-ideal-fundamentos",
    reviewQuestion: "Gas ideal em fundamentos deve ficar separado do uso estatistico e dos exemplos de ciclos."
  },
  {
    id: "calor",
    reviewQuestion: "Tema amplo de apoio avancado: nao deve misturar calor sensivel, entalpia e ciclos em exercicios basicos."
  },
  {
    id: "calor-fundamentos",
    reviewQuestion: "Calor em fundamentos deve ficar focado em definicao, calor sensivel e equilibrio termico."
  },
  {
    id: "calor-em-ciclos",
    reviewQuestion: "Calor em ciclos deve ficar separado dos conceitos introdutorios de calor."
  },
  {
    id: "trabalho",
    reviewQuestion: "Tema amplo de apoio avancado: nao deve misturar fundamentos, Legendre e ciclos em exercicios basicos."
  },
  {
    id: "trabalho-fundamentos",
    reviewQuestion: "Trabalho em fundamentos deve ficar separado de trabalho em ciclos."
  },
  {
    id: "trabalho-em-ciclos",
    reviewQuestion: "Trabalho em ciclos deve apoiar apenas questoes sobre motores, refrigeradores e exemplos ciclicos."
  },
  {
    id: "transicoes-de-fase",
    reviewQuestion: "O Cap. 04 esta bem agrupado ou algum item deveria ficar mais especifico?"
  },
  {
    id: "ciclos-termodinamicos",
    reviewQuestion: "O Cap. 06 esta completo como familia de ciclos, motores e refrigeradores?"
  },
  {
    id: "maxwell-relacoes",
    reviewQuestion: "Relacoes formais de Maxwell: manter separado da construcao de Maxwell."
  },
  {
    id: "construcao-maxwell",
    reviewQuestion: "Construcao de Maxwell em transicoes de fase: manter separado das relacoes formais de Maxwell."
  }
];

function safeFilePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value = "", maxChars = 620) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf("\n\n"), sliced.lastIndexOf(". "));
  if (lastBreak >= Math.floor(maxChars * 0.45)) {
    return `${sliced.slice(0, lastBreak + 1).trim()}...`;
  }

  return `${sliced.trimEnd()}...`;
}

function pdfHref(fragment) {
  const sectionFileName = `termo-capitulo-${fragment.chapterId}-secao-${safeFilePart(fragment.itemId)}-${safeFilePart(fragment.title)}.pdf`;
  const sectionFilePath = resolve(OUTPUT_DIR, sectionFileName);
  if (existsSync(sectionFilePath)) {
    return encodeURI(relative(OUTPUT_DIR, sectionFilePath));
  }

  const chapterFile = {
    "01": "termo-capitulo-01-conceitos-fundamentais.pdf",
    "02": "termo-capitulo-02-potenciais-termodinamicos-e-aplicacoes.pdf",
    "03": "termo-capitulo-03-termodinamica-estatistica.pdf",
    "04": "termo-capitulo-04-transicoes-de-fase.pdf",
    "06": "termo-capitulo-06-ciclos-termodinamicos.pdf"
  }[fragment.chapterId];

  if (!chapterFile) return "";

  const chapterFilePath = resolve(OUTPUT_DIR, chapterFile);
  return existsSync(chapterFilePath) ? encodeURI(relative(OUTPUT_DIR, chapterFilePath)) : "";
}

function fragmentCard(fragment) {
  const href = pdfHref(fragment);
  const pdfPages = fragment.pageStart
    ? `PDF p.${fragment.pageStart}${fragment.pageEnd && fragment.pageEnd !== fragment.pageStart ? `-${fragment.pageEnd}` : ""}`
    : "PDF nao mapeado";

  return `
    <article class="fragment-card">
      <div class="fragment-topline">
        <span>Cap. ${escapeHtml(fragment.chapterId)} · ${escapeHtml(fragment.itemId)}</span>
        <strong>${escapeHtml(fragment.relation === "primary-topic" ? "topico principal" : "relacionado")}</strong>
      </div>
      <h3>${escapeHtml(fragment.title)}</h3>
      <p class="meta">${escapeHtml(pdfPages)}</p>
      <div class="actions">
        ${href ? `<a href="${href}" target="_blank" rel="noreferrer">Abrir PDF</a>` : "<span>PDF nao encontrado</span>"}
        ${fragment.pagePath ? `<a href="../../../../${escapeHtml(fragment.pagePath)}" target="_blank" rel="noreferrer">Abrir pagina</a>` : ""}
      </div>
      <pre>${escapeHtml(truncate(fragment.excerpt || ""))}</pre>
    </article>
  `;
}

function topicSection(topic, reviewQuestion) {
  const chapters = Array.isArray(topic.chapters) ? topic.chapters.join(", ") : "";
  const fragments = (topic.fragments || []).map(fragmentCard).join("");
  const usage = topic.usage === "advanced-support" ? "Apoio avancado" : "Padrao";

  return `
    <section class="topic-section" id="${escapeHtml(topic.id)}">
      <div class="topic-header">
        <div>
          <div class="eyebrow">Tema transversal</div>
          <h2>${escapeHtml(topic.label)}</h2>
          <p>${escapeHtml(reviewQuestion)}</p>
        </div>
        <div class="topic-stats">
          <strong>${escapeHtml(topic.sectionCount)}</strong>
          <span>secoes</span>
          <small>Caps. ${escapeHtml(chapters)}</small>
          <small>${escapeHtml(usage)}</small>
        </div>
      </div>
      <div class="review-box">
        <strong>Como revisar:</strong>
        marque mentalmente se as secoes abaixo devem ficar, sair ou receber nota de cautela para a IA.
      </div>
      <div class="fragment-grid">${fragments}</div>
    </section>
  `;
}

function main() {
  if (!existsSync(TOPIC_INDEX_PATH)) {
    throw new Error(`Indice tematico nao encontrado: ${TOPIC_INDEX_PATH}`);
  }

  const topicIndex = JSON.parse(readFileSync(TOPIC_INDEX_PATH, "utf8"));
  const topicsById = new Map((topicIndex.topics || []).map((topic) => [topic.id, topic]));
  const topicNav = REVIEW_TOPICS.map(({ id }) => {
    const topic = topicsById.get(id);
    if (!topic) return "";
    return `<a href="#${escapeHtml(id)}">${escapeHtml(topic.label)}</a>`;
  }).join("");

  const sections = REVIEW_TOPICS.map(({ id, reviewQuestion }) => {
    const topic = topicsById.get(id);
    if (!topic) {
      return `<section class="topic-section"><h2>${escapeHtml(id)}</h2><p>Tema nao encontrado no indice.</p></section>`;
    }
    return topicSection(topic, reviewQuestion);
  }).join("\n");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TERMO · Revisao de Temas Transversais</title>
  <style>
    :root {
      --blue: #004f8f;
      --red: #b33a32;
      --green: #16824a;
      --ink: #23364b;
      --muted: #5e7085;
      --line: #d9e7f8;
      --wash: #f6f9fd;
      --soft-green: #ebfbf1;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: linear-gradient(135deg, #eef6ff 0%, #ffffff 38%, #f7fbf4 100%);
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.45;
    }
    main {
      width: min(1280px, calc(100vw - 32px));
      margin: 32px auto 64px;
    }
    .hero, .topic-section {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: 0 22px 60px rgba(0, 79, 143, 0.08);
    }
    .hero { padding: 30px; }
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
    .hero p, .topic-header p {
      max-width: 900px;
      color: var(--muted);
      font-size: 22px;
    }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
    .nav a, .actions a, .actions span {
      border: 1px solid #bcd4f5;
      border-radius: 999px;
      color: var(--blue);
      padding: 10px 14px;
      text-decoration: none;
      font: 800 15px/1 system-ui, sans-serif;
      background: #fff;
    }
    .topic-section {
      margin-top: 26px;
      padding: 26px;
    }
    .topic-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: start;
      border-bottom: 1px solid var(--line);
      padding-bottom: 20px;
      margin-bottom: 18px;
    }
    .topic-stats {
      min-width: 132px;
      border: 1px solid #bbe7c9;
      border-radius: 24px;
      background: var(--soft-green);
      color: var(--green);
      padding: 16px;
      text-align: center;
      font-family: system-ui, sans-serif;
    }
    .topic-stats strong { display: block; font-size: 42px; line-height: 1; }
    .topic-stats span { display: block; font-weight: 850; }
    .topic-stats small { display: block; color: var(--muted); margin-top: 6px; }
    .review-box {
      background: #fff8ed;
      border: 1px solid #f2d5a7;
      border-radius: 18px;
      color: #755122;
      padding: 14px 16px;
      margin-bottom: 18px;
      font-size: 18px;
    }
    .fragment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    .fragment-card {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: #fff;
      padding: 18px;
    }
    .fragment-topline {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font: 800 12px/1.2 system-ui, sans-serif;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .fragment-topline strong { color: var(--green); }
    .meta {
      color: var(--muted);
      font: 750 16px/1.2 system-ui, sans-serif;
      margin: 10px 0;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
    .actions a:first-child {
      background: var(--soft-green);
      border-color: #b9e8c7;
      color: #116a3a;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--wash);
      border: 1px solid var(--line);
      border-radius: 16px;
      max-height: 260px;
      overflow: auto;
      padding: 14px;
      font: 14px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    @media (max-width: 720px) {
      .topic-header { grid-template-columns: 1fr; }
      .topic-stats { text-align: left; }
      .hero, .topic-section { padding: 20px; border-radius: 22px; }
    }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <div class="eyebrow">TERMO · AI-02</div>
      <h1>Revisao por temas transversais</h1>
      <p>Use esta pagina para revisar por amostragem se os temas conectam as secoes certas do app. A pergunta principal e simples: este agrupamento ajuda a IA a gerar exercicios melhores ou pode confundir?</p>
      <nav class="nav">${topicNav}</nav>
    </header>
    ${sections}
  </main>
</body>
</html>
`,
    "utf8"
  );

  console.log(OUTPUT_PATH);
}

main();
