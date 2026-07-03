import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const slidesDir = path.join(rootDir, "slides");
const dataDir = path.join(rootDir, "data");

const SITE_URL = "https://termo-theta.vercel.app";
const COURSE_TITLE = "Termodinâmica para Estudantes de Física";
const AUTHOR_NAME = "Prof. Mario Reis";
const PUBLISHER_NAME = "Instituto de Física — Universidade Federal Fluminense";
const DEFAULT_SITE_DESCRIPTION = "Livro interativo de Termodinâmica com capítulos, exercícios automáticos por IA, simuladores, exemplos resolvidos e material didático do Prof. Mario Reis (IF-UFF).";
const TODAY = process.env.SITEMAP_LASTMOD || todayInSaoPaulo();
const SEO_ASSET_VERSION = process.env.SEO_ASSET_VERSION || TODAY.replaceAll("-", "");

const simulatorCatalog = [
  {
    id: "S01",
    sectionId: "1.3",
    sectionUrl: "slides/capitulo-01/page_4.html",
    title: "Escalas termométricas",
    description: "Conversão e visualização de temperaturas em Celsius, Fahrenheit e Kelvin.",
    appUrl: "index.html?view=simulators&sim=termometros",
    standaloneUrl: "simulators/termometros.html"
  },
  {
    id: "S02",
    sectionId: "1.10",
    sectionUrl: "slides/capitulo-01/page_11.html",
    title: "Equilíbrio térmico",
    description: "Temperatura de equilíbrio e calor trocado entre múltiplos materiais.",
    appUrl: "index.html?view=simulators&sim=eqtermico",
    standaloneUrl: "simulators/eqtermico.html"
  },
  {
    id: "S03",
    sectionId: "2.8",
    sectionUrl: "slides/capitulo-02/page_8.html",
    title: "Relações termodinâmicas e de Maxwell",
    description: "Retângulo termodinâmico, diferenciais e relações de Maxwell.",
    appUrl: "index.html?view=simulators&sim=qt",
    standaloneUrl: "simulators/qt.html"
  },
  {
    id: "S04",
    sectionId: "3.8",
    sectionUrl: "slides/capitulo-03/page_18.html",
    title: "Paramagnetismo",
    description: "Magnetização paramagnética com função de Brillouin.",
    appUrl: "index.html?view=simulators&sim=mag",
    standaloneUrl: "simulators/mag.html"
  },
  {
    id: "S05",
    sectionId: "4.5",
    sectionUrl: "slides/capitulo-04/page_9.html",
    title: "Van der Waals 1",
    description: "Isotermas, curva espinodal e ponto crítico em variáveis reduzidas.",
    appUrl: "index.html?view=simulators&sim=vdw",
    standaloneUrl: "simulators/vdw.html"
  },
  {
    id: "S06",
    sectionId: "4.6",
    sectionUrl: "slides/capitulo-04/page_11.html",
    title: "Van der Waals 2",
    description: "Relação entre isoterma de Van der Waals e energia livre g(v).",
    appUrl: "index.html?view=simulators&sim=vdw_pv_gv",
    standaloneUrl: "simulators/vdw_pv_gv.html"
  },
  {
    id: "S07",
    title: "Processo isotérmico",
    description: "Expansão e compressão isotérmicas de um gás ideal.",
    appUrl: "index.html?view=simulators&sim=isotermico",
    standaloneUrl: "simulators/isotermico.html"
  },
  {
    id: "S08",
    sectionId: "6.2",
    sectionUrl: "slides/capitulo-06/page_2.html",
    title: "Máquina térmica de Carnot",
    description: "Ciclo de Carnot, calores trocados, trabalho total e eficiência.",
    appUrl: "index.html?view=simulators&sim=mt_carnot",
    standaloneUrl: "simulators/mt_carnot.html"
  },
  {
    id: "S09",
    sectionId: "6.10",
    sectionUrl: "slides/capitulo-06/page_10.html",
    title: "Máquina térmica de Stirling",
    description: "Motor de Stirling tipo alfa com regenerador.",
    appUrl: "index.html?view=simulators&sim=stirling_reg",
    standaloneUrl: "simulators/stirling_reg.html"
  }
];

const chapterCatalog = {
  "01": {
    title: "Conceitos Fundamentais",
    description: "Conceitos fundamentais da Termodinâmica: equilíbrio térmico, temperatura, escalas, calor, trabalho e primeira lei."
  },
  "02": {
    title: "Potenciais Termodinâmicos e Aplicações",
    description: "Potenciais termodinâmicos, transformações de Legendre, energia livre, entalpia, relações de Maxwell e aplicações."
  },
  "03": {
    title: "Termodinâmica Estatística",
    description: "Termodinâmica estatística com ensembles, entropia, distribuição de Boltzmann, gás ideal e exemplos quânticos e clássicos."
  },
  "04": {
    title: "Transições de Fase",
    description: "Transições de fase, gás de Van der Waals, ponto crítico, estabilidade, coexistência e construção de Maxwell."
  },
  "05": {
    title: "Processos Termodinâmicos",
    description: "Processos termodinâmicos, trocas de calor e trabalho, transformações e interpretação física dos caminhos entre estados."
  },
  "06": {
    title: "Ciclos Termodinâmicos",
    description: "Ciclos termodinâmicos, máquinas térmicas, eficiência, refrigeradores e transformações cíclicas."
  }
};

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlEscape(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function truncate(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function cleanPageTitle(value) {
  const suffix = ` | ${COURSE_TITLE}`;
  let title = String(value || COURSE_TITLE).replace(/\s+/g, " ").trim();

  while (title.endsWith(suffix)) {
    title = title.slice(0, -suffix.length).trim();
  }

  return title || COURSE_TITLE;
}

async function collectHtmlFiles(dir, bucket = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(fullPath, bucket);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

async function loadTopicMap() {
  const entries = await readdir(dataDir);
  const chapterFiles = entries.filter((fileName) => /^capitulo-\d+\.json$/.test(fileName)).sort();
  const topicMap = new Map();

  for (const fileName of chapterFiles) {
    const chapterId = fileName.match(/^capitulo-(\d+)\.json$/)?.[1] || "";
    const raw = await readFile(path.join(dataDir, fileName), "utf8");
    const parsed = JSON.parse(raw);
    const topics = Array.isArray(parsed?.topics) ? parsed.topics : [];

    for (const topic of topics) {
      const normalizedUrl = String(topic.url || "").replace(/^\/+/, "");
      if (!normalizedUrl) continue;
      topicMap.set(normalizedUrl, {
        chapterId,
        chapterTitle: chapterCatalog[chapterId]?.title || `Capítulo ${Number(chapterId)}`,
        id: String(topic.id || "").trim(),
        title: String(topic.title || "").trim(),
        note: String(topic.note || "").trim()
      });
    }
  }

  return topicMap;
}

function getRelativeAssetPath(filePath, assetName) {
  return toPosix(path.relative(path.dirname(filePath), path.join(rootDir, "assets", assetName))) || assetName;
}

function getCanonicalUrl(relativePath) {
  if (!relativePath || relativePath === "index.html") {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}/${relativePath}`;
}

function getSlideChapterId(relativePath) {
  return relativePath.match(/^slides\/capitulo-(\d+)\/page_\d+\.html$/i)?.[1] || "";
}

function getCoverMeta(relativePath) {
  const match = relativePath.match(/^slides\/capitulo-(\d+)\/page_1\.html$/i);
  if (!match) return null;

  const chapterId = match[1];
  const chapter = chapterCatalog[chapterId];
  if (!chapter) return null;

  return {
    title: `Capítulo ${Number(chapterId)} — ${chapter.title} | ${COURSE_TITLE}`,
    description: truncate(`${chapter.description} Material interativo do livro ${COURSE_TITLE}, com autoria didática do ${AUTHOR_NAME}.`, 170)
  };
}

function getSourceCanonical(relativePath) {
  return relativePath.replace("/source/", "/");
}

function inferPageMeta(relativePath, html, topicMap) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const currentTitle = cleanPageTitle(titleMatch ? titleMatch[1] : COURSE_TITLE);
  const normalizedRelativePath = relativePath.replace(/^\/+/, "");
  const isIndex = normalizedRelativePath === "index.html";
  const isInstructions = normalizedRelativePath === "INSTRUCOES_SNIPPET.html";
  const isSource = normalizedRelativePath.includes("/source/");
  const topic = topicMap.get(normalizedRelativePath);
  const coverMeta = getCoverMeta(normalizedRelativePath);

  if (isIndex) {
    return {
      title: `${COURSE_TITLE} | Livro interativo de Termodinâmica`,
      description: DEFAULT_SITE_DESCRIPTION,
      canonical: `${SITE_URL}/`,
      robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: COURSE_TITLE,
          url: `${SITE_URL}/`,
          inLanguage: "pt-BR"
        },
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: COURSE_TITLE,
          description: DEFAULT_SITE_DESCRIPTION,
          provider: {
            "@type": "CollegeOrUniversity",
            name: PUBLISHER_NAME
          },
          creator: {
            "@type": "Person",
            name: AUTHOR_NAME
          },
          url: `${SITE_URL}/`
        }
      ]
    };
  }

  if (isInstructions) {
    return {
      title: `Instruções internas | ${COURSE_TITLE}`,
      description: "Arquivo interno de instruções do projeto.",
      canonical: `${SITE_URL}/`,
      robots: "noindex,nofollow,noarchive",
      ogType: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Instruções internas | ${COURSE_TITLE}`,
        description: "Arquivo interno de instruções."
      }
    };
  }

  const title = topic
    ? `${topic.title} | Capítulo ${Number(topic.chapterId)} | ${COURSE_TITLE}`
    : coverMeta?.title || `${currentTitle} | ${COURSE_TITLE}`;

  const description = topic
    ? truncate(`${topic.note} Material interativo do livro ${COURSE_TITLE}, com autoria didática do ${AUTHOR_NAME} (${PUBLISHER_NAME}).`, 170)
    : coverMeta?.description || truncate(`${currentTitle}. Página do livro interativo ${COURSE_TITLE}, criado por ${AUTHOR_NAME} no ${PUBLISHER_NAME}.`, 170);

  const canonicalRelativePath = isSource ? getSourceCanonical(normalizedRelativePath) : normalizedRelativePath;

  return {
    title,
    description,
    canonical: getCanonicalUrl(canonicalRelativePath),
    robots: isSource ? "noindex,follow,noarchive" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: title,
      description,
      url: getCanonicalUrl(canonicalRelativePath),
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      educationalUse: "instruction",
      learningResourceType: "InteractiveResource",
      author: {
        "@type": "Person",
        name: AUTHOR_NAME
      },
      publisher: {
        "@type": "CollegeOrUniversity",
        name: PUBLISHER_NAME
      },
      isPartOf: {
        "@type": "Course",
        name: COURSE_TITLE,
        url: `${SITE_URL}/`
      }
    }
  };
}

function buildSeoBlock(meta) {
  return [
    "<!-- termo-seo:start -->",
    `<meta name="description" content="${escapeHtml(meta.description)}"/>`,
    `<meta name="author" content="${escapeHtml(AUTHOR_NAME)}"/>`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}"/>`,
    `<meta name="googlebot" content="${escapeHtml(meta.robots)}"/>`,
    `<meta name="theme-color" content="#004B87"/>`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}"/>`,
    `<meta property="og:locale" content="pt_BR"/>`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}"/>`,
    `<meta property="og:site_name" content="${escapeHtml(COURSE_TITLE)}"/>`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}"/>`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}"/>`,
    `<meta name="twitter:card" content="summary"/>`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}"/>`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}"/>`,
    `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
    "<!-- termo-seo:end -->"
  ].join("\n");
}

function upsertTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `<title>${escapeHtml(title)}</title>\n</head>`);
}

function removeLegacySeoTags(html) {
  return html
    .replace(/\n?<meta\s+name="(?:description|author|robots|googlebot|theme-color|twitter:card|twitter:title|twitter:description)"\s+content="[^"]*"\s*\/?>/gi, "")
    .replace(/\n?<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, "")
    .replace(/\n?<meta\s+property="og:[^"]+"\s+content="[^"]*"\s*\/?>/gi, "")
    .replace(/\n?<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
}

function upsertSeoBlock(html, block) {
  const placeholder = "__TERMO_SEO_BLOCK__";

  if (/<!-- termo-seo:start -->[\s\S]*?<!-- termo-seo:end -->/i.test(html)) {
    const withPlaceholder = html.replace(/<!-- termo-seo:start -->[\s\S]*?<!-- termo-seo:end -->/i, placeholder);
    return removeLegacySeoTags(withPlaceholder).replace(placeholder, block);
  }

  return removeLegacySeoTags(html).replace(/<\/head>/i, `${block}\n</head>`);
}

function upsertSeoAsset(html, assetTag) {
  if (/termo-seo\.js/i.test(html)) {
    return html.replace(/<script defer src="[^"]*termo-seo\.js(?:\?v=[^"]*)?"><\/script>/i, assetTag);
  }
  return html.replace(/<\/head>/i, `${assetTag}\n</head>`);
}

async function processHtmlFile(filePath, topicMap) {
  const relativePath = toPosix(path.relative(rootDir, filePath));
  let html = await readFile(filePath, "utf8");
  const meta = inferPageMeta(relativePath, html, topicMap);
  const seoBlock = buildSeoBlock(meta);
  const assetTag = `<script defer src="${getRelativeAssetPath(filePath, "termo-seo.js")}?v=${SEO_ASSET_VERSION}"></script>`;

  html = upsertTitle(html, meta.title);
  html = upsertSeoBlock(html, seoBlock);
  html = upsertSeoAsset(html, assetTag);

  await writeFile(filePath, html, "utf8");
}

async function writeRobotsFile() {
  const content = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`
  ].join("\n");

  await writeFile(path.join(rootDir, "robots.txt"), `${content}\n`, "utf8");
}

function collectSitemapUrls(topicMap, htmlFiles) {
  const urls = new Set();
  urls.add(`${SITE_URL}/`);
  urls.add(`${SITE_URL}/conteudo.html`);
  urls.add(`${SITE_URL}/simulators/index.html`);

  const activeChapterIds = new Set();

  for (const topic of topicMap.values()) {
    if (topic.chapterId) activeChapterIds.add(topic.chapterId);
  }

  for (const filePath of htmlFiles) {
    const relativePath = toPosix(path.relative(rootDir, filePath));
    const chapterId = getSlideChapterId(relativePath);
    if (chapterId) activeChapterIds.add(chapterId);
  }

  for (const [relativeUrl] of topicMap.entries()) {
    urls.add(`${SITE_URL}/${relativeUrl}`);
  }

  for (const simulator of simulatorCatalog) {
    urls.add(`${SITE_URL}/${simulator.standaloneUrl}`);
  }

  for (const filePath of htmlFiles) {
    const relativePath = toPosix(path.relative(rootDir, filePath));
    if (!getSlideChapterId(relativePath)) continue;
    urls.add(`${SITE_URL}/${relativePath}`);
  }

  return urls;
}

function buildUrlsetXml(urls) {
  const body = Array.from(urls)
    .map((url) => [
      "  <url>",
      `    <loc>${xmlEscape(url)}</loc>`,
      "  </url>"
    ].join("\n"))
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>"
  ].join("\n");

  return xml;
}

async function writeSitemaps(topicMap, htmlFiles) {
  const urls = collectSitemapUrls(topicMap, htmlFiles);
  const pageSitemapXml = buildUrlsetXml(urls);
  const sitemapText = `${Array.from(urls).join("\n")}\n`;

  await writeFile(path.join(rootDir, "sitemap.xml"), `${pageSitemapXml}\n`, "utf8");
  await writeFile(path.join(rootDir, "sitemap.txt"), sitemapText, "utf8");
  await writeFile(path.join(rootDir, "sitemap-pages.xml"), `${pageSitemapXml}\n`, "utf8");
  await writeFile(path.join(rootDir, "sitemap-index.xml"), `${pageSitemapXml}\n`, "utf8");
}

function buildChapterSections(topicMap) {
  const chapters = new Map();

  for (const [relativeUrl, topic] of topicMap.entries()) {
    const chapterId = topic.chapterId || getSlideChapterId(relativeUrl);
    if (!chapterId || chapterId === "05") continue;

    if (!chapters.has(chapterId)) {
      chapters.set(chapterId, {
        id: chapterId,
        title: chapterCatalog[chapterId]?.title || `Capítulo ${Number(chapterId)}`,
        description: chapterCatalog[chapterId]?.description || "",
        topics: []
      });
    }

    chapters.get(chapterId).topics.push({
      ...topic,
      url: relativeUrl
    });
  }

  return Array.from(chapters.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function buildContentPage(topicMap) {
  const chapters = buildChapterSections(topicMap);
  const chapterCards = chapters.map((chapter) => {
    const topicItems = chapter.topics
      .sort((a, b) => String(a.id).localeCompare(String(b.id), "pt-BR", { numeric: true }))
      .map((topic) => [
        '          <li class="topic-item">',
        `            <a href="${escapeHtml(topic.url)}"><span>${escapeHtml(topic.id)}</span>${escapeHtml(topic.title)}</a>`,
        `            <p>${escapeHtml(topic.note || "Abrir página do tópico.")}</p>`,
        "          </li>"
      ].join("\n"))
      .join("\n");

    return [
      `      <section class="content-card" id="capitulo-${escapeHtml(chapter.id)}">`,
      "        <div>",
      `          <p class="eyebrow">Capítulo ${Number(chapter.id)}</p>`,
      `          <h2>${escapeHtml(chapter.title)}</h2>`,
      `          <p>${escapeHtml(chapter.description)}</p>`,
      `          <a class="chapter-link" href="index.html?view=chapters&amp;chapter=${escapeHtml(chapter.id)}">Abrir capítulo no app</a>`,
      "        </div>",
      '        <ol class="topic-list">',
      topicItems,
      "        </ol>",
      "      </section>"
    ].join("\n");
  }).join("\n");

  const simulatorItems = simulatorCatalog.map((simulator) => [
    '          <li class="simulator-item">',
    `            <a href="${escapeHtml(simulator.standaloneUrl)}"><span>${escapeHtml(simulator.id)}</span>${escapeHtml(simulator.title)}</a>`,
    `            <p>${escapeHtml(simulator.description)}</p>`,
    '            <div class="simulator-links">',
    `              <a href="${escapeHtml(simulator.appUrl)}">Abrir no app</a>`,
    simulator.sectionUrl ? `              <a href="${escapeHtml(simulator.sectionUrl)}">Seção ${escapeHtml(simulator.sectionId)}</a>` : "",
    "            </div>",
    "          </li>"
  ].filter(Boolean).join("\n")).join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Mapa de Conteúdo | ${COURSE_TITLE}`,
    description: "Mapa de capítulos, tópicos e simuladores do livro interativo de Termodinâmica.",
    url: `${SITE_URL}/conteudo.html`,
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "Course",
      name: COURSE_TITLE,
      url: `${SITE_URL}/`
    },
    author: {
      "@type": "Person",
      name: AUTHOR_NAME
    },
    publisher: {
      "@type": "CollegeOrUniversity",
      name: PUBLISHER_NAME
    }
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mapa de Conteúdo | Termodinâmica para Estudantes de Física</title>
  <meta name="description" content="Mapa de conteúdo crawlável do livro interativo Termodinâmica para Estudantes de Física: capítulos, tópicos, simuladores e recursos principais." />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <link rel="canonical" href="${SITE_URL}/conteudo.html" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:title" content="Mapa de Conteúdo | ${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:description" content="Capítulos, tópicos e simuladores do livro interativo de Termodinâmica." />
  <meta property="og:url" content="${SITE_URL}/conteudo.html" />
  <link href="https://fonts.googleapis.com" rel="preconnect" />
  <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #FCFCFA;
      --panel: #FFFFFF;
      --text: #2C3E50;
      --muted: #5D6D7E;
      --blue: #004B87;
      --border: #DDE3ED;
      --red: #B03A2E;
      --shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: "Inter", sans-serif;
      line-height: 1.55;
    }

    a {
      color: var(--blue);
      text-decoration: none;
      font-weight: 700;
    }

    a:hover {
      text-decoration: underline;
    }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 44px;
    }

    .hero,
    .content-card,
    .simulator-panel {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .hero {
      padding: clamp(22px, 4vw, 36px);
      margin-bottom: 18px;
    }

    .back-link,
    .quick-links a,
    .chapter-link {
      display: inline-flex;
      border: 1px solid #C7D8F3;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
      background: #FFFFFF;
    }

    .back-link {
      margin-bottom: 18px;
    }

    .kicker,
    .eyebrow {
      color: var(--red);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    h1 {
      color: var(--blue);
      font-size: clamp(30px, 5vw, 48px);
      line-height: 1.08;
      margin-bottom: 14px;
    }

    h2 {
      color: var(--blue);
      font-size: clamp(21px, 3vw, 30px);
      line-height: 1.15;
      margin-bottom: 10px;
    }

    .hero p,
    .content-card > div > p,
    .simulator-panel > div > p {
      color: var(--muted);
      font-family: "Lora", Georgia, serif;
      font-size: 16px;
      max-width: 820px;
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }

    .content-stack {
      display: grid;
      gap: 16px;
    }

    .content-card,
    .simulator-panel {
      display: grid;
      grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr);
      gap: 24px;
      padding: clamp(18px, 3vw, 28px);
      align-items: start;
    }

    .chapter-link {
      margin-top: 16px;
    }

    .topic-list,
    .simulator-list {
      list-style: none;
      display: grid;
      gap: 10px;
    }

    .topic-item,
    .simulator-item {
      border: 1px solid #E8EDF3;
      background: #F8FAFC;
      border-radius: 8px;
      padding: 12px 14px;
    }

    .topic-item a,
    .simulator-item a {
      display: inline-flex;
      gap: 9px;
      align-items: baseline;
      line-height: 1.35;
    }

    .topic-item span,
    .simulator-item span {
      color: var(--red);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .topic-item p,
    .simulator-item p {
      color: var(--muted);
      font-size: 13.5px;
      margin-top: 5px;
    }

    .simulator-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 8px;
      font-size: 13px;
    }

    @media (max-width: 760px) {
      .page {
        width: min(100% - 24px, 1180px);
        padding-top: 16px;
      }

      .content-card,
      .simulator-panel {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <main class="page">
    <section class="hero">
      <a class="back-link" href="index.html">Voltar ao app</a>
      <p class="kicker">Mapa do site</p>
      <h1>Conteúdo do livro interativo de Termodinâmica</h1>
      <p>Esta página reúne links diretos para os capítulos, tópicos e simuladores do projeto TERMO.</p>
      <nav class="quick-links" aria-label="Atalhos de conteúdo">
        ${chapters.map((chapter) => `<a href="#capitulo-${escapeHtml(chapter.id)}">Capítulo ${Number(chapter.id)}</a>`).join("\n        ")}
        <a href="#simuladores">Simuladores</a>
      </nav>
    </section>

    <div class="content-stack">
${chapterCards}

      <section class="simulator-panel" id="simuladores">
        <div>
          <p class="eyebrow">Recursos interativos</p>
          <h2>Simuladores</h2>
          <p>Simuladores independentes para explorar escalas termométricas, equilíbrio térmico, relações de Maxwell, Van der Waals, Carnot e Stirling.</p>
          <a class="chapter-link" href="index.html?view=simulators">Abrir catálogo no app</a>
        </div>
        <ol class="simulator-list">
${simulatorItems}
        </ol>
      </section>
    </div>
  </main>
</body>
</html>
`;
}

async function writeContentPage(topicMap) {
  await writeFile(path.join(rootDir, "conteudo.html"), buildContentPage(topicMap), "utf8");
}

const topicMap = await loadTopicMap();
const htmlFiles = [path.join(rootDir, "index.html"), path.join(rootDir, "INSTRUCOES_SNIPPET.html"), ...(await collectHtmlFiles(slidesDir))];

for (const filePath of htmlFiles) {
  await processHtmlFile(filePath, topicMap);
}

await writeContentPage(topicMap);
await writeRobotsFile();
await writeSitemaps(topicMap, htmlFiles);

console.log(`SEO atualizado em ${htmlFiles.length} HTMLs, conteudo.html, robots.txt, sitemap.xml, sitemap.txt e cópias de compatibilidade.`);
