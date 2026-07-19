import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const CORPUS_PATH = resolve(ROOT_DIR, "data/book-section-corpus.json");
const OUTPUT_DIR = resolve(ROOT_DIR, "output/pdf/book-reference");
const OUTPUT_PATH = resolve(OUTPUT_DIR, "revisao-amostras.html");

const SAMPLES = [
  { chapterId: "01", itemId: "1.1", note: "Conceito inicial: deve cair na Lei Zero e termometria." },
  { chapterId: "01", itemId: "1.12", note: "Trabalho termodinamico: bom para checar sinais e exemplo isotermico proximo." },
  { chapterId: "02", itemId: "2.3", note: "Helmholtz: deve comecar em 3.3.2 e parar antes de Entalpia." },
  { chapterId: "02", itemId: "2.8", note: "Multiplas referencias: Maxwell + Retangulo Termodinamico." },
  { chapterId: "03", itemId: "3.4", note: "Estatistica: deve ligar funcao de particao, Helmholtz e energia interna." },
  { chapterId: "04", itemId: "4.1", note: "Introducao corrigida: deve usar o inicio de Gas de Van der Waals, nao energia livre." },
  { chapterId: "04", itemId: "4.6", note: "Energia livre em transicoes: aqui sim deve cair em Helmholtz/Gibbs e estabilidade." },
  { chapterId: "06", itemId: "6.1", note: "Ciclos: deve abrir em maquinas termicas e refrigeradores." },
  { chapterId: "06", itemId: "6.8", note: "Stirling sem regenerador: deve cobrir etapas isotermicas/isocoricas e eficiencia." }
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

function truncate(value = "", maxChars = 1700) {
  const text = String(value || "").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
}

function pdfHref(section) {
  const fileName = `termo-capitulo-${section.chapterId}-secao-${safeFilePart(section.itemId)}-${safeFilePart(section.topicTitle)}.pdf`;
  const filePath = resolve(OUTPUT_DIR, fileName);
  return existsSync(filePath) ? encodeURI(relative(OUTPUT_DIR, filePath)) : "";
}

function sampleCard(section, note) {
  const href = pdfHref(section);
  const references = (section.references || []).map(function (reference) {
    const extractionSources = Array.isArray(reference.extractionSources) && reference.extractionSources.length
      ? reference.extractionSources.join(", ")
      : "pdftotext";
    return `
      <li>
        <strong>${escapeHtml(reference.label || reference.id)}</strong>
        <span>PDF p.${escapeHtml(reference.pageStart)}-${escapeHtml(reference.pageEnd)}</span>
        <small>extracao: ${escapeHtml(extractionSources)}</small>
        ${reference.mappingReason ? `<small>motivo: ${escapeHtml(reference.mappingReason)}</small>` : ""}
        ${reference.startMarker ? `<small>inicio: ${escapeHtml(reference.startMarker)}</small>` : ""}
        ${reference.endMarker ? `<small>fim: ${escapeHtml(reference.endMarker)}</small>` : ""}
      </li>
    `;
  }).join("");

  return `
    <article class="sample-card ${section.needsReview ? "needs-review" : ""}">
      <div class="sample-topline">
        <span>Cap. ${escapeHtml(section.chapterId)} · Item ${escapeHtml(section.itemId)}</span>
        ${section.needsReview ? "<strong>Revisar</strong>" : "<strong>OK estrutural</strong>"}
      </div>
      <h2>${escapeHtml(section.topicTitle)}</h2>
      <p class="note">${escapeHtml(note)}</p>
      <div class="actions">
        ${href ? `<a href="${href}" target="_blank" rel="noreferrer">Abrir PDF derivado</a>` : "<span>PDF derivado ainda nao encontrado</span>"}
        <a href="../../../../${escapeHtml(section.pagePath)}" target="_blank" rel="noreferrer">Abrir pagina do app</a>
      </div>
      <section>
        <h3>Referencias usadas</h3>
        <ul>${references}</ul>
      </section>
      <section>
        <h3>Trecho que a IA receberia</h3>
        <pre>${escapeHtml(truncate(section.content || section.excerpt || ""))}</pre>
      </section>
    </article>
  `;
}

function main() {
  if (!existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus nao encontrado: ${CORPUS_PATH}`);
  }

  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const sections = Array.isArray(corpus.sections) ? corpus.sections : [];
  const cards = SAMPLES.map(function (sample) {
    const section = sections.find(function (entry) {
      return String(entry.chapterId || "").padStart(2, "0") === sample.chapterId && String(entry.itemId || "") === sample.itemId;
    });
    if (!section) {
      return `<article class="sample-card needs-review"><h2>${escapeHtml(sample.chapterId)} ${escapeHtml(sample.itemId)}</h2><p>Nao encontrado no corpus.</p></article>`;
    }
    return sampleCard(section, sample.note);
  }).join("\n");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TERMO · Revisao de Amostras do Corpus</title>
  <style>
    :root {
      --blue: #004f8f;
      --red: #b33a32;
      --green: #16824a;
      --ink: #23364b;
      --muted: #5e7085;
      --line: #d9e7f8;
      --wash: #f6f9fd;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: linear-gradient(135deg, #eef6ff 0%, #ffffff 42%, #f7fbf4 100%);
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.45;
    }
    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 32px auto 56px;
    }
    header {
      background: white;
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 22px 60px rgba(0, 79, 143, 0.08);
    }
    .eyebrow {
      color: var(--red);
      font: 800 14px/1.2 system-ui, sans-serif;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    h1, h2, h3 { color: var(--blue); margin: 0; }
    h1 { font: 800 clamp(32px, 6vw, 58px)/1.02 system-ui, sans-serif; margin-top: 8px; }
    header p { max-width: 850px; color: var(--muted); font-size: 22px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 22px;
      margin-top: 24px;
    }
    .sample-card {
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 18px 48px rgba(0, 79, 143, 0.07);
    }
    .sample-card.needs-review { border-color: #f0c4ba; }
    .sample-topline {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font: 800 13px/1.2 system-ui, sans-serif;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .sample-topline strong { color: var(--green); }
    .needs-review .sample-topline strong { color: var(--red); }
    h2 { font: 800 26px/1.1 system-ui, sans-serif; }
    h3 {
      font: 800 14px/1.2 system-ui, sans-serif;
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-top: 22px;
    }
    .note { color: var(--muted); font-size: 18px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0; }
    .actions a, .actions span {
      border: 1px solid #bcd4f5;
      border-radius: 999px;
      color: var(--blue);
      padding: 10px 14px;
      text-decoration: none;
      font: 800 15px/1 system-ui, sans-serif;
      background: #fff;
    }
    .actions a:first-child {
      background: #eaf7ef;
      border-color: #b9e8c7;
      color: #116a3a;
    }
    ul { padding-left: 20px; }
    li { margin: 10px 0; }
    li span, li small { display: block; color: var(--muted); }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--wash);
      border: 1px solid var(--line);
      border-radius: 18px;
      max-height: 440px;
      overflow: auto;
      padding: 16px;
      font: 15px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">TERMO · AI-01</div>
      <h1>Revisao de amostras do corpus</h1>
      <p>Esta pagina mostra exemplos do mapa app/PDF. O PDF derivado ajuda na revisao visual; o trecho abaixo e o texto que a IA usaria como referencia.</p>
    </header>
    <section class="grid">
      ${cards}
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
