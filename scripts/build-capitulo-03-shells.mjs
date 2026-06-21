import { readFile, readdir, writeFile } from "node:fs/promises";

const COURSE_TITLE = "Termodinâmica para Estudantes de Física";
const SOURCE_DIR = new URL("../slides/capitulo-03/source/", import.meta.url);
const OUTPUT_DIR = new URL("../slides/capitulo-03/", import.meta.url);

const itemBlocks = [
  {
    id: "3.1",
    title: "Entropia, Gibbs e a Visão por Ensembles",
    note: "Panorama histórico da entropia, formulação de Gibbs e Jaynes e introdução ao conceito de ensemble estatístico.",
    pages: [2, 3, 4],
    aiExercise: true
  },
  {
    id: "3.2",
    title: "Ensemble Micro-Canônico e Fórmula de Boltzmann",
    note: "Sistema isolado, postulado da equiprobabilidade e derivação da relação de Boltzmann.",
    pages: [5, 6],
    aiExercise: true
  },
  {
    id: "3.3",
    title: "Ensemble Canônico, Distribuição de Boltzmann e Parâmetro Beta",
    note: "Contato com reservatório térmico, distribuição de Boltzmann, função de partição e significado físico do parâmetro beta.",
    pages: [7, 8, 9],
    aiExercise: true
  },
  {
    id: "3.4",
    title: "Energia Livre de Helmholtz e Energia Interna Estatística",
    note: "Relação entre função de partição, energia livre de Helmholtz e energia interna como média estatística.",
    pages: [10, 11],
    aiExercise: true
  },
  {
    id: "3.5",
    title: "Partículas Distinguíveis, Indistinguíveis e Paradoxo de Gibbs",
    note: "Contagem de microestados, extensividade e correção por N! para partículas indistinguíveis.",
    pages: [12, 13],
    aiExercise: true
  },
  {
    id: "3.6",
    title: "Exemplo I: Gás Ideal Monoatômico — Função de Partição",
    note: "Construção da função de partição do gás ideal e papel do comprimento de onda térmico de de Broglie.",
    pages: [14, 15],
    aiExercise: true
  },
  {
    id: "3.7",
    title: "Exemplo I: Gás Ideal Monoatômico — Energia Livre e Sackur-Tetrode",
    note: "Energia livre, equação de estado, energia interna e entropia do gás ideal na formulação de Sackur-Tetrode.",
    pages: [16, 17],
    aiExercise: true
  },
  {
    id: "3.8",
    title: "Exemplo II: Paramagnetismo Quântico",
    note: "Modelo de spin, magnetização estatística e função de Brillouin.",
    pages: [18, 19],
    aiExercise: true
  },
  {
    id: "3.9",
    title: "Exemplo III: Paramagnetismo Clássico",
    note: "Limite clássico dos momentos magnéticos e interpretação via função de Langevin.",
    pages: [20],
    aiExercise: true
  },
  {
    id: "3.10",
    title: "Terceira Lei e Limites do Modelo Clássico",
    note: "Postulado de Nernst, zero absoluto, entropia residual e falha do tratamento clássico em baixas temperaturas.",
    pages: [21, 22],
    aiExercise: true
  },
  {
    id: "3.11",
    title: "Exemplo IV: Capacidade Calorífica em Sólidos",
    note: "Dulong-Petit, sólido de Einstein, quantização da vibração e calor específico em diferentes regimes.",
    pages: [23, 24, 25],
    aiExercise: true
  }
];

const coverPage = {
  id: "3",
  title: "Termodinâmica Estatística",
  note: "Do microcosmo ao macrocosmo: entropia, funções de partição e potenciais termodinâmicos a partir de primeiros princípios.",
  pages: [1],
  aiExercise: false
};

const exercisePage = {
  id: "3.12",
  title: "Exercícios Resolvidos e Aplicações Práticas",
  note: "Resumo, consolidação e aplicações práticas dos principais resultados do capítulo.",
  pages: [26],
  aiExercise: false
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

const STRUCTURAL_RE = /(root|slide|canvas|layout|wrapper|container|content-area|main-content|column|columns|stage|panel)/i;
const CARD_RE = /(card|module|panel)/i;
const CARD_EXCLUDE_RE = /(heading|header|title|icon|label|badge|button|text|paragraph|body|list|item|row|cell|formula|math|equation|latex|table|image|caption|footer|author|metadata)/i;
const FORCE_CARD_RE = /(academic-info-card|content-card-module|entropy-historical-card|gibbs-jaynes-info-card|gibbs-jaynes-accent-card|ensemble-card-item|microcanonical-left-motivation-card|microcanonical-left-derivation-card|microcanonical-right-interpretation-card|microcanonical-right-summary-card|beta-left-context-card|beta-left-derivation-card|beta-right-result-card|beta-right-analogy-card|beta-right-exercise-card|gas-ideal-derivation-card|thermo-math-card|thermo-academic-card-item|theory-explanation-card-block|langevin-info-card-block|thermo-theory-content-card|academic-card-module|accent-card-module|einstein-solid-card|einstein-analysis-card|einstein-provocation-card|info-card-module|math-step-card-item|definition-card|derivation-card|context-card|result-card|analysis-card|example-card|exercise-content-card|exercise-tip-box|theory-provocation-card|analogy-didactic-card|interactive-tip-box|pedagogical-insight-box-wrapper|statistical-mechanics-exercise-tip-box|theoretical-insight-accent-box|thermo-provocation-alert-box|provocacao-box-footer|gas-ideal-accent-box|accent-note-box|highlight-box-result)/i;
const MATH_BLOCK_RE = /(latex-display|math-block|math-display|math-constraint|formula|equation|result-equation|thermo-math-display|math-derivation-block|equation-highlight|formula-highlight|equation-display|einstein-solid-equation|langevin-equation|constraint-box)/i;
const CALLOUT_RE = /(note|tip|insight|provoca|provocation|warning|summary|highlight|accent|alert|badge|result|conclusion|analogy)/i;
const HEADING_RE = /(heading|header|title|sub-heading|subheading|label)/i;
const TITLE_REGION_RE = /(title-region|title-section|title-main|page-title|slide-main-heading|beta-title|cover-section-label|cover-main-title|cover-chapter-badge|cover-author|horizontal-divider)/i;

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function collapseText(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function normalizeWhitespace(html) {
  return html
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseAttributes(raw) {
  const attrs = {};
  const attrRe = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of raw.matchAll(attrRe)) {
    const name = match[1].toLowerCase();
    attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function parseSingleElementAttributes(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b([\\s\\S]*?)>`, "i"));
  return match ? parseAttributes(match[1]) : {};
}

function createElement(tag, attrs = {}, children = []) {
  return { type: "element", tag: tag.toLowerCase(), attrs, children };
}

function createText(value) {
  return { type: "text", value };
}

function parseFragment(html) {
  const root = { type: "root", children: [] };
  const stack = [root];
  const tokenRe = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g;

  for (const match of html.matchAll(tokenRe)) {
    const token = match[0];
    const current = stack[stack.length - 1];

    if (token.startsWith("<!--") || token.startsWith("<!")) {
      continue;
    }

    if (!token.startsWith("<")) {
      current.children.push(createText(token));
      continue;
    }

    if (token.startsWith("</")) {
      const closeTag = token.match(/^<\/\s*([a-zA-Z][\w:-]*)/i)?.[1]?.toLowerCase();
      if (!closeTag) continue;
      while (stack.length > 1) {
        const popped = stack.pop();
        if (popped.tag === closeTag) break;
      }
      continue;
    }

    const open = token.match(/^<\s*([a-zA-Z][\w:-]*)([\s\S]*?)\/?>$/);
    if (!open) continue;
    const tag = open[1].toLowerCase();
    const rawAttrs = open[2] || "";
    const element = createElement(tag, parseAttributes(rawAttrs));
    current.children.push(element);

    if (!VOID_TAGS.has(tag) && !/\/\s*>$/.test(token)) {
      stack.push(element);
    }
  }

  return root;
}

function cloneNode(node) {
  if (node.type === "text") return createText(node.value);
  return createElement(node.tag, { ...node.attrs }, node.children.map(cloneNode));
}

function className(node) {
  return node?.type === "element" ? String(node.attrs.class || "") : "";
}

function hasClassMatch(node, pattern) {
  return pattern.test(className(node));
}

function textContent(node) {
  if (!node) return "";
  if (node.type === "text") return decodeEntities(node.value);
  return (node.children || []).map(textContent).join(" ");
}

function compactText(node) {
  return collapseText(textContent(node));
}

function hasDescendant(node, predicate) {
  if (!node?.children) return false;
  for (const child of node.children) {
    if (child.type === "element" && (predicate(child) || hasDescendant(child, predicate))) {
      return true;
    }
  }
  return false;
}

function containsMedia(node) {
  return hasDescendant(node, (child) => ["img", "table", "svg", "canvas"].includes(child.tag));
}

function hasSubstantialContent(node) {
  return compactText(node).length > 24 || containsMedia(node);
}

function isMathBlock(node) {
  if (node?.type !== "element") return false;
  const cls = className(node);
  if (!MATH_BLOCK_RE.test(cls)) return false;
  if (/card|module|content|text|explanation/i.test(cls) && !/display|formula|equation|latex|constraint|derivation-block/i.test(cls)) {
    return false;
  }
  return true;
}

function isCalloutBlock(node) {
  if (node?.type !== "element") return false;
  const cls = className(node);
  if (!CALLOUT_RE.test(cls)) return false;
  if (isMathBlock(node)) return false;
  return hasSubstantialContent(node);
}

function isColumnCard(node) {
  const cls = className(node);
  return /column/i.test(cls)
    && hasSubstantialContent(node)
    && hasDescendant(node, isHeadingNode)
    && !hasDescendant(node, isCardCandidate);
}

function isImageCard(node) {
  const cls = className(node);
  return /(image|visual)/i.test(cls) && hasDescendant(node, (child) => child.tag === "img");
}

function isIntroCard(node) {
  const cls = className(node);
  return /(intro-text-block|explanation-block|text-block|description-block)/i.test(cls)
    && hasSubstantialContent(node)
    && !/body|paragraph/i.test(cls);
}

function isCardCandidate(node) {
  if (node?.type !== "element" || !["div", "section", "article"].includes(node.tag)) return false;
  const cls = className(node);
  if (!cls || TITLE_REGION_RE.test(cls)) return false;
  if (FORCE_CARD_RE.test(cls)) return hasSubstantialContent(node);
  if (isImageCard(node) || isIntroCard(node)) return true;
  if (isColumnCard(node)) return true;
  if (STRUCTURAL_RE.test(cls) && !CARD_RE.test(cls)) return false;
  return CARD_RE.test(cls) && !CARD_EXCLUDE_RE.test(cls) && hasSubstantialContent(node);
}

function isHeadingNode(node) {
  if (node?.type !== "element") return false;
  if (/^h[2-5]$/.test(node.tag)) return compactText(node).length > 1;
  const cls = className(node);
  if (!HEADING_RE.test(cls)) return false;
  if (/body|paragraph|step-label|section-label|formula|math|equation|caption|badge/i.test(cls)) return false;
  const text = compactText(node);
  return text.length > 1 && text.length < 180;
}

function shouldSkipSubtree(node) {
  if (node?.type !== "element") return false;
  if (["script", "style", "noscript"].includes(node.tag)) return true;
  return TITLE_REGION_RE.test(className(node));
}

function removeNode(root, target) {
  if (!root?.children) return false;
  const index = root.children.indexOf(target);
  if (index !== -1) {
    root.children.splice(index, 1);
    return true;
  }
  return root.children.some((child) => removeNode(child, target));
}

function findHeading(node) {
  if (!node?.children) return null;
  const queue = [...node.children];
  while (queue.length) {
    const current = queue.shift();
    if (current.type !== "element" || shouldSkipSubtree(current) || isMathBlock(current)) continue;
    if (isHeadingNode(current)) return current;
    queue.push(...current.children);
  }
  return null;
}

function cleanInline(node) {
  if (node.type === "text") return collapseText(node.value);
  if (node.type !== "element") return "";
  if (["script", "style", "noscript"].includes(node.tag)) return "";

  const inner = node.children.map(cleanInline).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  if (node.tag === "i") {
    const iconClass = className(node)
      .split(/\s+/)
      .filter((cls) => /^fa/.test(cls) || cls === "fas" || cls === "far" || cls === "fab")
      .join(" ");
    return iconClass ? `<i class="${escapeAttr(iconClass)}"></i>` : "";
  }

  if (node.tag === "br") return "<br/>";

  if (node.tag === "a") {
    const href = node.attrs.href ? ` href="${escapeAttr(node.attrs.href)}"` : "";
    return `<a${href}>${inner}</a>`;
  }

  if (["strong", "b", "em"].includes(node.tag)) {
    return `<${node.tag}>${inner}</${node.tag}>`;
  }

  return inner;
}

function renderHeading(node) {
  const heading = cleanInline(node).replace(/\s+/g, " ").trim();
  return heading || compactText(node);
}

function cardVariant(node, headingHtml) {
  const fingerprint = `${className(node)} ${headingHtml} ${compactText(node).slice(0, 240)}`.toLowerCase();
  if (/warning|aten[cç][aã]o|falha|limite|paradoxo|prova|exercise|exerc[ií]cio|tip|dica|provoca|insight|aplica/.test(fingerprint)) {
    return "purple";
  }
  if (/deriva|diferencial|parti[cç][aã]o|fun[cç][aã]o|c[aá]lculo|equation|math|energia interna|boltzmann|helmholtz|langevin|brillouin/.test(fingerprint)) {
    return "green";
  }
  return "";
}

function cleanNode(node, variant = "", insideCallout = false) {
  if (node.type === "text") {
    return node.value.replace(/[ \t]+/g, " ");
  }
  if (node.type !== "element" || shouldSkipSubtree(node)) return "";

  if (node.tag === "br") return "<br/>";
  if (node.tag === "script" || node.tag === "style" || node.tag === "noscript") return "";

  if (node.tag === "img") {
    const src = node.attrs.src ? ` src="${escapeAttr(node.attrs.src)}"` : "";
    const alt = node.attrs.alt ? ` alt="${escapeAttr(node.attrs.alt)}"` : " alt=\"\"";
    return src ? `<img${src}${alt}/>` : "";
  }

  if (node.tag === "a") {
    const href = node.attrs.href ? ` href="${escapeAttr(node.attrs.href)}"` : "";
    const target = node.attrs.target ? ` target="${escapeAttr(node.attrs.target)}"` : "";
    const rel = node.attrs.rel ? ` rel="${escapeAttr(node.attrs.rel)}"` : "";
    return `<a${href}${target}${rel}>${cleanNodes(node.children, variant, insideCallout)}</a>`;
  }

  if (node.tag === "i") {
    const iconClass = className(node)
      .split(/\s+/)
      .filter((cls) => /^fa/.test(cls) || cls === "fas" || cls === "far" || cls === "fab")
      .join(" ");
    return iconClass ? `<i class="${escapeAttr(iconClass)}"></i>` : "";
  }

  if (["strong", "b", "em", "sub", "sup"].includes(node.tag)) {
    return `<${node.tag}>${cleanNodes(node.children, variant, insideCallout)}</${node.tag}>`;
  }

  if (["ul", "ol", "li", "p", "thead", "tbody", "tr", "th", "td"].includes(node.tag)) {
    return `<${node.tag}>${cleanNodes(node.children, variant, insideCallout)}</${node.tag}>`;
  }

  if (/^h[1-6]$/.test(node.tag)) {
    return `<p><strong>${cleanNodes(node.children, variant, insideCallout)}</strong></p>`;
  }

  if (node.tag === "table") {
    return `<div class="table-wrap"><table class="summary-table">${cleanNodes(node.children, variant, insideCallout)}</table></div>`;
  }

  if (isMathBlock(node)) {
    const classSuffix = variant ? ` ${variant}` : "";
    return `<div class="math-box${classSuffix}">${cleanNodes(node.children, variant, insideCallout)}</div>`;
  }

  if (isCalloutBlock(node)) {
    if (insideCallout) {
      return cleanNodes(node.children, variant, true);
    }
    const cls = /warning|aten[cç][aã]o|alert|falha|limite/i.test(`${className(node)} ${compactText(node)}`)
      ? "warning"
      : "highlight";
    return `<div class="${cls}">${cleanNodes(node.children, variant, true)}</div>`;
  }

  return cleanNodes(node.children, variant, insideCallout);
}

function cleanNodes(nodes, variant = "", insideCallout = false) {
  return normalizeWhitespace(nodes.map((node) => cleanNode(node, variant, insideCallout)).filter(Boolean).join("\n"));
}

function renderCard(originalNode, fallbackTitle = "Conceito") {
  const node = cloneNode(originalNode);
  const headingNode = findHeading(node);
  let headingHtml = "";

  if (headingNode) {
    headingHtml = renderHeading(headingNode);
    removeNode(node, headingNode);
  }

  if (!headingHtml) {
    headingHtml = fallbackTitle;
  }

  const variant = cardVariant(node, headingHtml);
  const bodyHtml = cleanNodes(node.children, variant);
  if (!bodyHtml && !headingHtml) return null;

  const titleClass = variant ? `card-title ${variant}` : "card-title";
  const wide = bodyHtml.includes("<table") || bodyHtml.length > 1800 || hasDescendant(node, (child) => child.tag === "img");

  return {
    wide,
    html: `<section class="card">
<div class="${titleClass}">
${headingHtml}
</div>

<div class="body-text">
${bodyHtml}
</div>
</section>`
  };
}

function collectCards(node, out = []) {
  if (!node?.children) return out;

  for (const child of node.children) {
    if (child.type !== "element" || shouldSkipSubtree(child)) continue;
    if (isCardCandidate(child)) {
      const card = renderCard(child);
      if (card) out.push(card);
      continue;
    }
    collectCards(child, out);
  }

  return out;
}

function groupCards(cards) {
  const output = [];
  let pair = [];

  const flushPair = () => {
    if (!pair.length) return;
    if (pair.length === 1) {
      output.push(pair[0].html);
    } else {
      output.push(`<div class="grid">
${pair.map((card) => card.html).join("\n\n")}
</div>`);
    }
    pair = [];
  };

  for (const card of cards) {
    if (card.wide) {
      flushPair();
      output.push(card.html);
      continue;
    }
    pair.push(card);
    if (pair.length === 2) flushPair();
  }

  flushPair();
  return output.join("\n\n");
}

function extractBody(html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) {
    throw new Error("Nao foi possivel localizar o body no HTML fonte.");
  }
  return body;
}

async function readSource(pageNumber) {
  return readFile(new URL(`page_${pageNumber}.html`, SOURCE_DIR), "utf8");
}

async function renderSourcePage(pageNumber) {
  const source = await readSource(pageNumber);
  const body = extractBody(source)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const tree = parseFragment(body);
  const cards = collectCards(tree);

  if (cards.length) {
    return groupCards(cards);
  }

  const fallback = renderCard(createElement("div", {}, tree.children), `Página ${pageNumber}`);
  return fallback ? fallback.html : "";
}

function extractAll(pattern, html) {
  return Array.from(html.matchAll(pattern), (match) => match[1]);
}

async function renderCoverContent() {
  const source = await readSource(1);
  const imageAttrs = parseSingleElementAttributes(source, "img");
  const formula = collapseText(source.match(/<div class="cover-equation-accent-formula">([\s\S]*?)<\/div>/i)?.[1] || "");
  const topics = extractAll(/<div class="cover-topic-tag-item"><span>([\s\S]*?)<\/span><\/div>/gi, source)
    .map((topic) => `<li>${collapseText(topic)}</li>`)
    .join("\n");

  const imageHtml = imageAttrs.src
    ? `<section class="card">
<div class="card-title">
<i class="fa-solid fa-atom"></i>
Visualização científica
</div>
<div class="body-text">
<img src="${escapeAttr(imageAttrs.src)}" alt="${escapeAttr(imageAttrs.alt || "Visualização científica")}"/>
</div>
</section>`
    : "";

  const summaryHtml = `<section class="card">
<div class="card-title green">
<i class="fa-solid fa-square-root-variable"></i>
Relação central
</div>
<div class="body-text">
<div class="math-box green">
${formula}
</div>
<div class="highlight">
<strong>Tópicos do capítulo:</strong>
<ul>
${topics}
</ul>
</div>
</div>
</section>`;

  return `<div class="grid">
${imageHtml}

${summaryHtml}
</div>`;
}

async function renderItemContent(pages) {
  const fragments = [];
  for (const page of pages) {
    fragments.push(await renderSourcePage(page));
  }
  return fragments.filter(Boolean).join("\n\n");
}

function pageTemplate({ id, title, note, content, aiExercise = false }) {
  const aiAssets = aiExercise
    ? `<link rel="stylesheet" href="../../assets/ai-exercises.css">
<script defer src="../../assets/ai-exercises.js"></script>`
    : "";
  const aiSection = aiExercise
    ? `<section data-termo-ai-exercise data-exercise-theme="purple"></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title} | Capítulo 3 | ${COURSE_TITLE}</title>

<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css" rel="stylesheet"/>

<script>
window.va = window.va || function () {
  (window.vaq = window.vaq || []).push(arguments);
};
</script>
<script defer src="/_vercel/insights/script.js"></script>

<script>
window.MathJax = {
  tex: { inlineMath: [['\\\\(','\\\\)'], ['$', '$']], displayMath: [['\\\\[','\\\\]']] },
  svg: { fontCache: 'global' }
};
</script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>

${aiAssets}
<link rel="stylesheet" href="../../assets/termo-share.css">
<script defer src="../../assets/termo-share.js"></script>
<link rel="stylesheet" href="../../assets/termo-auth.css?v=0611.4">
<link rel="stylesheet" href="../../assets/capitulo-02-layout.css?v=0611.4">
<script defer src="../../assets/termo-auth.js?v=0611.4"></script>
<script defer src="../../assets/termo-user-data.js"></script>
<script defer src="../../assets/termo-seo.js?v=0609.2"></script>
</head>

<body>

<div class="page">

<section class="hero">
<div class="hero-inner">

<a href="../../index.html?chapter=03" class="index-back-button">
<i class="fa-solid fa-arrow-left"></i>
Índice
</a>

<div class="chapter-label">
<i class="fa-solid fa-layer-group"></i>
Capítulo 3 · Item ${id}
</div>

<h1 class="chapter-title">${title}</h1>

<div class="chapter-text">
<p>${note}</p>
</div>

</div>
</section>

${content}

${aiSection}

</div>

</body>
</html>`;
}

async function writePage(pageNumber, html) {
  await writeFile(new URL(`page_${pageNumber}.html`, OUTPUT_DIR), `${normalizeWhitespace(html)}\n`, "utf8");
}

async function assertAllSourcesExist() {
  const files = new Set(await readdir(SOURCE_DIR));
  for (let page = 1; page <= 26; page += 1) {
    if (!files.has(`page_${page}.html`)) {
      throw new Error(`Fonte ausente: slides/capitulo-03/source/page_${page}.html`);
    }
  }
}

await assertAllSourcesExist();

const coverContent = await renderCoverContent();
await writePage(1, pageTemplate({ ...coverPage, content: coverContent }));

for (const block of itemBlocks) {
  const content = await renderItemContent(block.pages);
  const html = pageTemplate({ ...block, content });
  for (const page of block.pages) {
    await writePage(page, html);
  }
}

const exerciseContent = await renderItemContent(exercisePage.pages);
await writePage(26, pageTemplate({ ...exercisePage, content: exerciseContent }));
