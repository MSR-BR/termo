import { readFile, writeFile } from "node:fs/promises";

const blocks = [
  {
    id: "3.1",
    title: "Entropia, Gibbs e a Visão por Ensembles",
    note: "Panorama histórico da entropia, formulação de Gibbs e Jaynes e introdução ao conceito de ensemble estatístico.",
    pages: [2, 3, 4]
  },
  {
    id: "3.2",
    title: "Ensemble Micro-Canônico e Fórmula de Boltzmann",
    note: "Sistema isolado, postulado da equiprobabilidade e derivação da relação de Boltzmann.",
    pages: [5, 6]
  },
  {
    id: "3.3",
    title: "Ensemble Canônico, Distribuição de Boltzmann e Parâmetro Beta",
    note: "Contato com reservatório térmico, distribuição de Boltzmann, função de partição e significado físico do parâmetro beta.",
    pages: [7, 8, 9]
  },
  {
    id: "3.4",
    title: "Energia Livre de Helmholtz e Energia Interna Estatística",
    note: "Relação entre função de partição, energia livre de Helmholtz e energia interna como média estatística.",
    pages: [10, 11]
  },
  {
    id: "3.5",
    title: "Partículas Distinguíveis, Indistinguíveis e Paradoxo de Gibbs",
    note: "Contagem de microestados, extensividade e correção por N! para partículas indistinguíveis.",
    pages: [12, 13]
  },
  {
    id: "3.6",
    title: "Exemplo I: Gás Ideal Monoatômico — Função de Partição",
    note: "Construção da função de partição do gás ideal e papel do comprimento de onda térmico de de Broglie.",
    pages: [14, 15]
  },
  {
    id: "3.7",
    title: "Exemplo I: Gás Ideal Monoatômico — Energia Livre e Sackur-Tetrode",
    note: "Energia livre, equação de estado, energia interna e entropia do gás ideal na formulação de Sackur-Tetrode.",
    pages: [16, 17]
  },
  {
    id: "3.8",
    title: "Exemplo II: Paramagnetismo Quântico",
    note: "Modelo de spin, magnetização estatística e função de Brillouin.",
    pages: [18, 19]
  },
  {
    id: "3.9",
    title: "Exemplo III: Paramagnetismo Clássico",
    note: "Limite clássico dos momentos magnéticos e interpretação via função de Langevin.",
    pages: [20]
  },
  {
    id: "3.10",
    title: "Terceira Lei e Limites do Modelo Clássico",
    note: "Postulado de Nernst, zero absoluto, entropia residual e falha do tratamento clássico em baixas temperaturas.",
    pages: [21, 22]
  },
  {
    id: "3.11",
    title: "Exemplo IV: Capacidade Calorífica em Sólidos",
    note: "Dulong-Petit, sólido de Einstein, quantização da vibração e calor específico em diferentes regimes.",
    pages: [23, 24, 25]
  }
];

function pageTemplate({ id, title, note, content }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>

<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet"/>
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

<link href="../../assets/chapter-embedded-slide.css" rel="stylesheet"/>
<link href="../../assets/ai-exercises.css" rel="stylesheet"/>
<link href="../../assets/termo-share.css" rel="stylesheet"/>
<link href="../../assets/termo-auth.css" rel="stylesheet"/>
<script defer src="../../assets/ai-exercises.js"></script>
<script defer src="../../assets/termo-share.js"></script>
<script defer src="../../assets/termo-auth.js"></script>
<script defer src="../../assets/termo-user-data.js"></script>
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

  <div class="content-root">
    ${content}
  </div>

  <section data-termo-ai-exercise data-exercise-theme="purple"></section>
</div>
<script src="../../assets/chapter-embedded-slide.js"></script>
</body>
</html>`;
}

function extractMatches(pattern, text) {
  return Array.from(text.matchAll(pattern), (match) => match[1]);
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    throw new Error("Nao foi possivel localizar o body do HTML original.");
  }
  return match[1];
}

function cleanupBody(body) {
  const headerPatterns = [
    /<div class="[^"]*title-region[^"]*"[\s\S]*?<\/div>/i,
    /<div class="[^"]*title-section[^"]*"[\s\S]*?<\/div>/i,
    /<div class="[^"]*title-header[^"]*"[\s\S]*?<\/div>/i,
    /<header[\s\S]*?<\/header>/i
  ];

  let cleaned = body.replace(/<!--[\s\S]*?-->/g, "");
  for (const pattern of headerPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned
    .replace(/\sstyle="overflow:\s*hidden;?"/gi, "")
    .trim();
}

function normalizeCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/width:\s*1280px\s*;/gi, "width: 100%;")
    .replace(/height:\s*720px\s*;/gi, "height: auto;")
    .replace(/overflow:\s*hidden\s*;/gi, "overflow: visible;");
}

function scopeSelector(selector, scope) {
  const trimmed = selector.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed === "body" || trimmed === "html" || trimmed === ":root") {
    return scope;
  }
  if (trimmed === "*") {
    return `${scope} *`;
  }
  if (trimmed.startsWith("body ")) {
    return `${scope} ${trimmed.slice(5)}`;
  }
  if (trimmed.startsWith("html ")) {
    return `${scope} ${trimmed.slice(5)}`;
  }
  if (trimmed.startsWith("body.")) {
    return `${scope}${trimmed.slice(4)}`;
  }
  if (trimmed.startsWith("html.")) {
    return `${scope}${trimmed.slice(4)}`;
  }
  return `${scope} ${trimmed}`;
}

function scopeSelectors(selectors, scope) {
  return selectors
    .split(",")
    .map((selector) => scopeSelector(selector, scope))
    .join(", ");
}

function scopeCssBlock(css, scope) {
  let index = 0;
  let output = "";

  while (index < css.length) {
    const braceIndex = css.indexOf("{", index);
    if (braceIndex === -1) {
      output += css.slice(index);
      break;
    }

    const selectorChunk = css.slice(index, braceIndex).trim();
    let depth = 1;
    let cursor = braceIndex + 1;

    while (cursor < css.length && depth > 0) {
      if (css[cursor] === "{") depth += 1;
      if (css[cursor] === "}") depth -= 1;
      cursor += 1;
    }

    const block = css.slice(braceIndex + 1, cursor - 1);

    if (!selectorChunk) {
      index = cursor;
      continue;
    }

    if (selectorChunk.startsWith("@media") || selectorChunk.startsWith("@supports")) {
      output += `${selectorChunk}{${scopeCssBlock(block, scope)}}`;
    } else if (selectorChunk.startsWith("@")) {
      output += `${selectorChunk}{${block}}`;
    } else {
      output += `${scopeSelectors(selectorChunk, scope)}{${block}}`;
    }

    index = cursor;
  }

  return output;
}

function responsiveOverrides(scope) {
  return `
${scope}{
  display:block !important;
  width:100% !important;
  max-width:100% !important;
  margin:0 !important;
  padding:0 !important;
  background:transparent !important;
  overflow:visible !important;
}
${scope} > div{
  width:100% !important;
  max-width:100% !important;
  height:auto !important;
  min-height:0 !important;
  margin:0 !important;
  overflow:visible !important;
}
${scope} [class*="title-region"],
${scope} [class*="title-section"],
${scope} [class*="title-header"]{
  display:none !important;
}
${scope} img,
${scope} svg,
${scope} canvas,
${scope} video{
  max-width:100% !important;
  height:auto !important;
}
${scope} mjx-container,
${scope} .MathJax,
${scope} .mjx-chtml{
  max-width:100% !important;
  overflow-x:auto !important;
  overflow-y:hidden !important;
}
@media (max-width:980px){
  ${scope} [class*="columns-wrapper"],
  ${scope} [class*="content-layout"],
  ${scope} [class*="content-area"],
  ${scope} [class*="layout-row"],
  ${scope} [class*="main-content"],
  ${scope} [class*="interaction-wrapper"]{
    display:flex !important;
    flex-direction:column !important;
    gap:16px !important;
  }
  ${scope} [class*="left-"],
  ${scope} [class*="right-"],
  ${scope} [class*="-column"]{
    width:100% !important;
    max-width:100% !important;
    flex:1 1 auto !important;
  }
  ${scope} [class*="grid"]{
    grid-template-columns:1fr !important;
  }
}
@media (max-width:700px){
  ${scope} [class*="columns-wrapper"],
  ${scope} [class*="content-layout"],
  ${scope} [class*="content-area"],
  ${scope} [class*="layout-row"],
  ${scope} [class*="main-content"],
  ${scope} [class*="interaction-wrapper"]{
    padding-left:16px !important;
    padding-right:16px !important;
  }
  ${scope} [class*="title-main-heading"]{
    font-size:clamp(1.7rem, 6vw, 2.25rem) !important;
    line-height:1.12 !important;
  }
}
`;
}

async function renderSourcePage(pageNumber) {
  const html = await readFile(
    new URL(`../slides/capitulo-03/source/page_${pageNumber}.html`, import.meta.url),
    "utf8"
  );

  const styleText = normalizeCss(extractMatches(/<style[^>]*>([\s\S]*?)<\/style>/gi, html).join("\n"));
  const body = cleanupBody(extractBody(html));
  const scope = `.source-embed.page-${pageNumber}`;
  const scopedCss = `${scopeCssBlock(styleText, scope)}\n${responsiveOverrides(scope)}`;

  return `
  <section class="source-fragment">
    <style>${scopedCss}</style>
    <div class="source-embed page-${pageNumber}">
      ${body}
    </div>
  </section>`;
}

async function renderBlockContent(pages) {
  const fragments = [];
  for (const page of pages) {
    fragments.push(await renderSourcePage(page));
  }
  return fragments.join("\n");
}

for (const block of blocks) {
  const content = await renderBlockContent(block.pages);
  const html = pageTemplate({ ...block, content });

  for (const page of block.pages) {
    await writeFile(
      new URL(`../slides/capitulo-03/page_${page}.html`, import.meta.url),
      html,
      "utf8"
    );
  }
}
