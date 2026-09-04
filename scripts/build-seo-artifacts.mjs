import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const slidesDir = path.join(rootDir, "slides");
const dataDir = path.join(rootDir, "data");

const SITE_URL = "https://termo-theta.vercel.app";
const GITHUB_PAGES_URL = "https://msr-br.github.io/termo";
const GITHUB_REPOSITORY_URL = "https://github.com/MSR-BR/termo";
const ANALYTICS_ASSET_VERSION = "0731.1";
const COURSE_TITLE = "Termodinâmica para Estudantes de Física";
const AUTHOR_NAME = "Prof. Mario Reis";
const PUBLISHER_NAME = "Instituto de Física — Universidade Federal Fluminense";
const DEFAULT_SITE_DESCRIPTION = "Livro interativo de Termodinâmica com capítulos, exercícios automáticos por IA, simulados por capítulo, pontos de estudo, desafio do dia, simuladores e material didático do Prof. Mario Reis (IF-UFF).";
const APP_TITLE = "TERMO — App de Termodinâmica | Capítulos, exercícios e simuladores";
const APP_DESCRIPTION = "App gratuito de Termodinâmica para estudantes de Física, com capítulos interativos, exercícios por IA, simulados científicos, pontos e trilhas de estudo.";
const HOME_TITLE = "Termodinâmica para Estudantes de Física — Livro interativo | TERMO";
const HOME_DESCRIPTION = "Livro interativo gratuito de Termodinâmica do Prof. Mario Reis (IF-UFF), com teoria, capítulos, exercícios, simulados e recursos para estudantes de Física.";
const AUTHOR_SAME_AS = [
  "https://profmarioreis.wordpress.com/thermodynamics/",
  "https://international.uff.br/pesquisas-de-destaque/",
  "https://www.uff.br/informe/professor-da-uff-lanca-livro-didatico-sobre-mecanica-quantica/"
];
const TODAY = process.env.SITEMAP_LASTMOD || todayInSaoPaulo();
const SEO_ASSET_VERSION = process.env.SEO_ASSET_VERSION || "20260718";

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

function buildAnalyticsScriptTag(src) {
  return `<script defer src="${src}?v=${ANALYTICS_ASSET_VERSION}"></script>`;
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
      title: APP_TITLE,
      description: APP_DESCRIPTION,
      canonical: `${SITE_URL}/`,
      robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TERMO",
          alternateName: COURSE_TITLE,
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
            name: AUTHOR_NAME,
            sameAs: AUTHOR_SAME_AS
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
  urls.add(`${SITE_URL}/home.html`);
  urls.add(`${SITE_URL}/conteudo.html`);
  urls.add(`${SITE_URL}/leis-da-termodinamica.html`);
  urls.add(`${SITE_URL}/exercicios-de-termodinamica.html`);
  urls.add(`${SITE_URL}/simuladores-de-termodinamica.html`);
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
    description: "Mapa de capítulos, tópicos, simulados, desafio do dia e simuladores do livro interativo de Termodinâmica.",
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
  <meta name="description" content="Mapa de conteúdo crawlável do TERMO: capítulos, tópicos, exercícios por IA, simulados por capítulo, desafio do dia, simuladores e recursos principais." />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <link rel="canonical" href="${SITE_URL}/conteudo.html" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:title" content="Mapa de Conteúdo | ${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:description" content="Capítulos, tópicos, simulados por capítulo, desafio do dia e simuladores do livro interativo de Termodinâmica." />
  <meta property="og:url" content="${SITE_URL}/conteudo.html" />
  <link href="https://fonts.googleapis.com" rel="preconnect" />
  <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;600&display=swap" rel="stylesheet" />
  ${buildAnalyticsScriptTag("assets/termo-analytics.js")}
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
      <p>Esta página reúne links diretos para os capítulos, tópicos, simulados por capítulo, desafio do dia e simuladores do projeto TERMO.</p>
      <nav class="quick-links" aria-label="Atalhos de conteúdo">
        <a href="home.html">Apresentação</a>
        <a href="index.html?view=journey">Pontos e simulados</a>
        <a href="index.html?view=daily-challenge">Desafio do dia</a>
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

function buildHomePage(topicMap) {
  const chapters = buildChapterSections(topicMap);
  const topicCount = chapters.reduce((total, chapter) => total + chapter.topics.length, 0);
  const heroImage = "assets/images/capitulo-04/isotermas-van-der-waals.jpg";

  const routeCards = [
    {
      label: "App e capítulos",
      title: "Abrir o app TERMO",
      description: "Acesso direto ao livro interativo, com capítulos, exercícios por IA, pontos e simulados.",
      href: "index.html"
    },
    {
      label: "Pontos e simulados",
      title: "Acompanhar desbloqueios",
      description: "Veja sua pontuação, nível, sequência de estudo e simulados IA liberados por capítulo.",
      href: "index.html?view=journey"
    },
    {
      label: "Desafio do dia",
      title: "Resolver revisão curta",
      description: "Pergunta de múltipla escolha baseada em tópicos já estudados ou capítulos com simulado feito.",
      href: "index.html?view=daily-challenge"
    },
    {
      label: "Simuladores",
      title: "Ver recursos interativos",
      description: "Catálogo de simulações para escalas termométricas, equilíbrio térmico, Maxwell, Van der Waals, Carnot e Stirling.",
      href: "simuladores-de-termodinamica.html"
    },
    {
      label: "Guia de estudo",
      title: "Leis da Termodinâmica",
      description: "Uma rota orientada pela Lei Zero, Primeira, Segunda e Terceira Leis, com acesso aos tópicos do livro.",
      href: "leis-da-termodinamica.html"
    },
    {
      label: "Prática",
      title: "Exercícios de Termodinâmica",
      description: "Entenda como praticar por capítulo, revisar conceitos e acompanhar o avanço dentro do TERMO.",
      href: "exercicios-de-termodinamica.html"
    }
  ];

  const routeCardMarkup = routeCards.map((card) => [
    '        <article class="route-card">',
    `          <p class="card-label">${escapeHtml(card.label)}</p>`,
    `          <h3><a href="${escapeHtml(card.href)}">${escapeHtml(card.title)}</a></h3>`,
    `          <p>${escapeHtml(card.description)}</p>`,
    "        </article>"
  ].join("\n")).join("\n");

  const chapterCards = chapters.map((chapter) => {
    const topicLinks = chapter.topics
      .sort((a, b) => String(a.id).localeCompare(String(b.id), "pt-BR", { numeric: true }))
      .map((topic) => [
        '              <li>',
        `                <a href="${escapeHtml(topic.url)}"><span>${escapeHtml(topic.id)}</span>${escapeHtml(topic.title)}</a>`,
        "              </li>"
      ].join("\n"))
      .join("\n");

    return [
      `        <article class="chapter-card" id="capitulo-${escapeHtml(chapter.id)}">`,
      '          <div class="chapter-copy">',
      `            <p class="card-label">Capítulo ${Number(chapter.id)}</p>`,
      `            <h3>${escapeHtml(chapter.title)}</h3>`,
      `            <p>${escapeHtml(chapter.description)}</p>`,
      '            <div class="card-actions">',
      `              <a href="index.html?view=chapters&amp;chapter=${escapeHtml(chapter.id)}">Abrir no app</a>`,
      `              <a href="conteudo.html#capitulo-${escapeHtml(chapter.id)}">Ver no mapa</a>`,
      "            </div>",
      "          </div>",
      '          <ol class="topic-links">',
      topicLinks,
      "          </ol>",
      "        </article>"
    ].join("\n");
  }).join("\n");

  const simulatorCards = simulatorCatalog.map((simulator) => [
    '        <article class="simulator-card">',
    `          <p class="card-label">${escapeHtml(simulator.id)}</p>`,
    `          <h3><a href="${escapeHtml(simulator.standaloneUrl)}">${escapeHtml(simulator.title)}</a></h3>`,
    `          <p>${escapeHtml(simulator.description)}</p>`,
    '          <div class="card-actions">',
    `            <a href="${escapeHtml(simulator.standaloneUrl)}">Abrir simulador</a>`,
    `            <a href="${escapeHtml(simulator.appUrl)}">Abrir no app</a>`,
    simulator.sectionUrl ? `            <a href="${escapeHtml(simulator.sectionUrl)}">Seção ${escapeHtml(simulator.sectionId)}</a>` : "",
    "          </div>",
    "        </article>"
  ].filter(Boolean).join("\n")).join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/home.html`,
    inLanguage: "pt-BR",
    about: {
      "@type": "Course",
      name: COURSE_TITLE,
      description: HOME_DESCRIPTION,
      provider: {
        "@type": "CollegeOrUniversity",
        name: PUBLISHER_NAME
      },
      creator: {
        "@type": "Person",
        name: AUTHOR_NAME,
        sameAs: AUTHOR_SAME_AS
      }
    },
    mainEntity: chapters.map((chapter) => ({
      "@type": "LearningResource",
      name: `Capítulo ${Number(chapter.id)} — ${chapter.title}`,
      description: chapter.description,
      url: `${SITE_URL}/conteudo.html#capitulo-${chapter.id}`
    }))
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(HOME_TITLE)}</title>
  <meta name="description" content="${escapeHtml(HOME_DESCRIPTION)}" />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <link rel="canonical" href="${SITE_URL}/home.html" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:title" content="${escapeHtml(HOME_TITLE)}" />
  <meta property="og:description" content="${escapeHtml(HOME_DESCRIPTION)}" />
  <meta property="og:url" content="${SITE_URL}/home.html" />
  <meta property="og:image" content="${SITE_URL}/${heroImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(HOME_TITLE)}" />
  <meta name="twitter:description" content="${escapeHtml(HOME_DESCRIPTION)}" />
  <meta name="twitter:image" content="${SITE_URL}/${heroImage}" />
  <link href="https://fonts.googleapis.com" rel="preconnect" />
  <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;600&display=swap" rel="stylesheet" />
  ${buildAnalyticsScriptTag("assets/termo-analytics.js")}
  <style>
    :root {
      --bg: #FCFCFA;
      --panel: #FFFFFF;
      --panel-soft: #F8FAFC;
      --text: #263747;
      --muted: #5D6D7E;
      --blue: #004B87;
      --blue-dark: #102A43;
      --red: #B03A2E;
      --green: #28745A;
      --border: #DDE3ED;
      --shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
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
      font-weight: 700;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .hero {
      min-height: min(62vh, 560px);
      display: grid;
      align-items: end;
      background:
        linear-gradient(90deg, rgba(8, 25, 43, 0.90), rgba(8, 25, 43, 0.64) 50%, rgba(8, 25, 43, 0.18)),
        url("${heroImage}") center / cover no-repeat;
      color: #FFFFFF;
      padding: clamp(22px, 6vw, 64px) 0;
    }

    .wrap {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero-content {
      max-width: 800px;
    }

    .hero-brandmark {
      display: inline-flex;
      align-items: center;
      margin-bottom: 18px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.10);
      backdrop-filter: blur(8px);
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
    }

    .hero-brandmark img {
      width: clamp(112px, 16vw, 160px);
      height: auto;
      display: block;
      border-radius: 10px;
    }

    .top-links,
    .quick-links,
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .top-links {
      margin-bottom: 26px;
    }

    .top-links a,
    .quick-links a,
    .card-actions a {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.12);
      color: #FFFFFF;
      font-size: 13px;
      backdrop-filter: blur(8px);
    }

    .kicker,
    .card-label,
    .section-label {
      color: var(--red);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero .kicker {
      color: #F5C2BA;
      margin-bottom: 8px;
    }

    h1 {
      max-width: 760px;
      font-size: clamp(34px, 6vw, 62px);
      line-height: 1.03;
      margin-bottom: 16px;
    }

    .hero p {
      max-width: 720px;
      color: #EAF0F7;
      font-family: "Lora", Georgia, serif;
      font-size: clamp(17px, 2.2vw, 21px);
    }

    .hero-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .hero-stat {
      min-width: 126px;
      border-left: 3px solid #F5C2BA;
      padding-left: 12px;
    }

    .hero-stat strong {
      display: block;
      color: #FFFFFF;
      font-size: 24px;
      line-height: 1;
    }

    .hero-stat span {
      color: #DCE7F1;
      font-size: 13px;
    }

    main {
      padding: 22px 0 48px;
    }

    .intro-grid,
    .simulator-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .section-block {
      margin-top: 30px;
    }

    .section-header {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
      max-width: 820px;
    }

    .section-header h2 {
      color: var(--blue);
      font-size: clamp(24px, 3.4vw, 38px);
      line-height: 1.1;
    }

    .section-header p {
      color: var(--muted);
      font-family: "Lora", Georgia, serif;
      font-size: 16px;
    }

    .route-card,
    .chapter-card,
    .simulator-card {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .route-card,
    .simulator-card {
      padding: 18px;
    }

    .route-card h3,
    .simulator-card h3,
    .chapter-card h3 {
      color: var(--blue-dark);
      font-size: 19px;
      line-height: 1.22;
      margin: 8px 0 8px;
    }

    .route-card p,
    .simulator-card p,
    .chapter-card p {
      color: var(--muted);
      font-size: 14px;
    }

    .route-card:nth-child(2) .card-label,
    .chapter-card:nth-child(even) .card-label {
      color: var(--green);
    }

    .chapter-list {
      display: grid;
      gap: 16px;
    }

    .chapter-card {
      display: grid;
      grid-template-columns: minmax(230px, 0.38fr) minmax(0, 1fr);
      gap: 22px;
      padding: clamp(18px, 3vw, 26px);
    }

    .chapter-copy {
      display: grid;
      align-content: start;
      gap: 4px;
    }

    .chapter-copy .card-actions,
    .simulator-card .card-actions {
      margin-top: 14px;
    }

    .chapter-copy .card-actions a,
    .simulator-card .card-actions a {
      border-color: #C7D8F3;
      background: #FFFFFF;
      color: var(--blue);
      backdrop-filter: none;
    }

    .topic-links {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 16px;
      list-style: none;
    }

    .topic-links a {
      display: inline-flex;
      gap: 8px;
      align-items: baseline;
      line-height: 1.35;
      font-size: 14px;
    }

    .topic-links span {
      color: var(--red);
      font-size: 12px;
      font-weight: 800;
      min-width: 32px;
    }

    .simulator-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .footer-note {
      margin-top: 28px;
      border-top: 1px solid var(--border);
      padding-top: 18px;
      color: var(--muted);
      font-size: 14px;
    }

    .mobile-study-cta,
    .mobile-study-path {
      display: none;
    }

    @media (max-width: 980px) {
      .intro-grid,
      .simulator-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .chapter-card {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 680px) {
      .wrap {
        width: min(100% - 24px, 1180px);
      }

      .hero {
        min-height: 540px;
        background-position: center top;
      }

      .intro-grid,
      .simulator-grid,
      .topic-links {
        grid-template-columns: 1fr;
      }

      .top-links a,
      .quick-links a,
      .card-actions a {
        min-height: 34px;
      }

      .mobile-study-cta {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 2px 12px;
        align-items: center;
        margin-top: 20px;
        border-radius: 16px;
        padding: 16px 18px;
        background: var(--blue);
        box-shadow: var(--shadow);
        color: #FFFFFF;
      }

      .mobile-study-cta:hover { text-decoration: none; }
      .mobile-study-cta__title { font-size: 18px; font-weight: 800; }
      .mobile-study-cta__detail { color: rgba(255,255,255,.86); font-size: 13px; font-weight: 600; }
      .mobile-study-cta__arrow { grid-column: 2; grid-row: 1 / span 2; font-size: 22px; }
      .mobile-study-path { display: grid; gap: 8px; margin-top: 14px; padding: 0; list-style: none; }
      .mobile-study-path li { display: flex; gap: 9px; align-items: flex-start; color: rgba(255,255,255,.92); font-size: 13px; font-weight: 650; line-height: 1.35; }
      .mobile-study-path strong { display: inline-grid; flex: 0 0 auto; width: 20px; height: 20px; place-items: center; border: 1px solid rgba(255,255,255,.55); border-radius: 50%; color: #FFFFFF; font-size: 11px; }
    }
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header class="hero">
    <div class="wrap hero-content">
      <nav class="top-links" aria-label="Acessos principais">
        <a href="index.html">Abrir app</a>
        <a href="index.html?view=journey">Pontos e simulados</a>
        <a href="index.html?view=daily-challenge">Desafio do dia</a>
        <a href="conteudo.html">Mapa de conteúdo</a>
        <a href="#capitulos">Capítulos</a>
        <a href="#simuladores">Simuladores</a>
      </nav>
      <a class="hero-brandmark" href="index.html" aria-label="Abrir o app TERMO">
        <img src="assets/termo-logo.png" alt="Logo do TERMO" />
      </a>
      <p class="kicker">Livro interativo aberto</p>
      <h1>${escapeHtml(COURSE_TITLE)}</h1>
      <p>${escapeHtml(DEFAULT_SITE_DESCRIPTION)}</p>
      <a class="mobile-study-cta" href="index.html?view=chapters&amp;chapter=01" aria-label="Começar a estudar o Capítulo 1: Conceitos fundamentais">
        <span class="mobile-study-cta__title">Começar a estudar</span>
        <span class="mobile-study-cta__detail">Capítulo 1 · Conceitos fundamentais</span>
        <span class="mobile-study-cta__arrow" aria-hidden="true">→</span>
      </a>
      <ol class="mobile-study-path" aria-label="Como estudar no TERMO">
        <li><strong>1</strong><span>Leia o Capítulo 1 no seu ritmo.</span></li>
        <li><strong>2</strong><span>Pratique com exercícios gerados por IA.</span></li>
        <li><strong>3</strong><span>Desbloqueie simulados à medida que avança.</span></li>
      </ol>
      <div class="hero-stats" aria-label="Resumo do conteúdo">
        <div class="hero-stat"><strong>${chapters.length}</strong><span>capítulos disponíveis</span></div>
        <div class="hero-stat"><strong>${topicCount}</strong><span>tópicos com páginas diretas</span></div>
        <div class="hero-stat"><strong>${chapters.length}</strong><span>simulados IA por capítulo</span></div>
        <div class="hero-stat"><strong>${simulatorCatalog.length}</strong><span>simuladores interativos</span></div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="section-block" aria-labelledby="rotas-principais">
      <div class="section-header">
        <p class="section-label">Entrada rápida</p>
        <h2 id="rotas-principais">Rotas principais do projeto</h2>
        <p>Escolha entre abrir a experiência completa, acompanhar pontos e simulados, fazer uma revisão curta ou entrar nos simuladores.</p>
      </div>
      <div class="intro-grid">
${routeCardMarkup}
      </div>
    </section>

    <section class="section-block" id="capitulos" aria-labelledby="capitulos-heading">
      <div class="section-header">
        <p class="section-label">Capítulos e tópicos</p>
        <h2 id="capitulos-heading">Acesso direto ao material didático</h2>
        <p>Cada tópico abaixo aponta para uma página HTML própria, adequada para leitura, referência em disciplinas e indexação por buscadores.</p>
      </div>
      <div class="chapter-list">
${chapterCards}
      </div>
    </section>

    <section class="section-block" id="simuladores" aria-labelledby="simuladores-heading">
      <div class="section-header">
        <p class="section-label">Recursos interativos</p>
        <h2 id="simuladores-heading">Simuladores de Termodinâmica</h2>
        <p>Ferramentas independentes para visualizar conceitos, testar parâmetros e conectar modelos matemáticos com comportamento físico.</p>
      </div>
      <div class="simulator-grid">
${simulatorCards}
      </div>
    </section>

    <p class="footer-note">${escapeHtml(COURSE_TITLE)} é um projeto didático de ${escapeHtml(AUTHOR_NAME)} no ${escapeHtml(PUBLISHER_NAME)}. · <a href="termos.html">Termos de Uso</a> · <a href="privacidade.html">Privacidade</a></p>
  </main>
</body>
</html>
`;
}

function buildGithubPagesBridge(topicMap) {
  const chapters = buildChapterSections(topicMap);
  const topicCount = chapters.reduce((total, chapter) => total + chapter.topics.length, 0);
  const heroImage = `${SITE_URL}/assets/images/capitulo-04/isotermas-van-der-waals.jpg`;

  const chapterCards = chapters.map((chapter) => [
    '        <article class="content-card">',
    `          <p class="card-label">Capítulo ${Number(chapter.id)}</p>`,
    `          <h3>${escapeHtml(chapter.title)}</h3>`,
    `          <p>${escapeHtml(chapter.description)}</p>`,
    '          <div class="card-actions">',
    `            <a href="${SITE_URL}/index.html?view=chapters&amp;chapter=${escapeHtml(chapter.id)}">Abrir capítulo</a>`,
    `            <a href="${SITE_URL}/conteudo.html#capitulo-${escapeHtml(chapter.id)}">Ver tópicos</a>`,
    "          </div>",
    "        </article>"
  ].join("\n")).join("\n");

  const simulatorCards = simulatorCatalog.map((simulator) => [
    '        <article class="content-card">',
    `          <p class="card-label">${escapeHtml(simulator.id)}</p>`,
    `          <h3>${escapeHtml(simulator.title)}</h3>`,
    `          <p>${escapeHtml(simulator.description)}</p>`,
    '          <div class="card-actions">',
    `            <a href="${SITE_URL}/${escapeHtml(simulator.standaloneUrl)}">Abrir simulador</a>`,
    `            <a href="${SITE_URL}/${escapeHtml(simulator.appUrl)}">Abrir no app</a>`,
    "          </div>",
    "        </article>"
  ].join("\n")).join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${COURSE_TITLE} | Página ponte`,
    description: DEFAULT_SITE_DESCRIPTION,
    url: `${GITHUB_PAGES_URL}/`,
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "WebSite",
      name: "GitHub Pages"
    },
    mainEntity: {
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
      url: `${SITE_URL}/home.html`,
      sameAs: [
        SITE_URL,
        GITHUB_REPOSITORY_URL
      ]
    }
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TERMO | Livro interativo de Termodinâmica</title>
  <meta name="description" content="${escapeHtml(DEFAULT_SITE_DESCRIPTION)}" />
  <meta name="author" content="${escapeHtml(AUTHOR_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
  <link rel="canonical" href="${SITE_URL}/home.html" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TERMO" />
  <meta property="og:title" content="${escapeHtml(COURSE_TITLE)}" />
  <meta property="og:description" content="${escapeHtml(DEFAULT_SITE_DESCRIPTION)}" />
  <meta property="og:url" content="${GITHUB_PAGES_URL}/" />
  <meta property="og:image" content="${heroImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(COURSE_TITLE)}" />
  <meta name="twitter:description" content="${escapeHtml(DEFAULT_SITE_DESCRIPTION)}" />
  <meta name="twitter:image" content="${heroImage}" />
  <link href="https://fonts.googleapis.com" rel="preconnect" />
  <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:wght@400;600&display=swap" rel="stylesheet" />
  ${buildAnalyticsScriptTag(`${SITE_URL}/assets/termo-analytics.js`)}
  <style>
    :root {
      --bg: #FCFCFA;
      --panel: #FFFFFF;
      --text: #263747;
      --muted: #5D6D7E;
      --blue: #004B87;
      --blue-dark: #102A43;
      --red: #B03A2E;
      --green: #28745A;
      --border: #DDE3ED;
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
      font-weight: 700;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .hero {
      display: grid;
      align-items: end;
      min-height: min(62vh, 560px);
      background:
        linear-gradient(90deg, rgba(8, 25, 43, 0.91), rgba(8, 25, 43, 0.64) 55%, rgba(8, 25, 43, 0.22)),
        url("${heroImage}") center / cover no-repeat;
      color: #FFFFFF;
      padding: clamp(26px, 6vw, 66px) 0;
    }

    .wrap {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero-content {
      max-width: 820px;
    }

    .kicker,
    .section-label,
    .card-label {
      color: var(--red);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero .kicker {
      color: #F5C2BA;
      margin-bottom: 8px;
    }

    h1 {
      max-width: 780px;
      margin-bottom: 16px;
      font-size: clamp(34px, 6vw, 60px);
      line-height: 1.03;
    }

    h2 {
      color: var(--blue);
      font-size: clamp(24px, 3.4vw, 38px);
      line-height: 1.1;
    }

    h3 {
      color: var(--blue-dark);
      font-size: 19px;
      line-height: 1.22;
      margin: 8px 0;
    }

    .hero p {
      max-width: 720px;
      color: #EAF0F7;
      font-family: "Lora", Georgia, serif;
      font-size: clamp(17px, 2.1vw, 21px);
    }

    .actions,
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .actions {
      margin-top: 24px;
    }

    .actions a,
    .card-actions a {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.38);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.12);
      color: #FFFFFF;
      font-size: 13px;
    }

    .hero-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .hero-stat {
      min-width: 132px;
      border-left: 3px solid #F5C2BA;
      padding-left: 12px;
    }

    .hero-stat strong {
      display: block;
      color: #FFFFFF;
      font-size: 24px;
      line-height: 1;
    }

    .hero-stat span {
      color: #DCE7F1;
      font-size: 13px;
    }

    main {
      padding: 24px 0 48px;
    }

    .section-block {
      margin-top: 30px;
    }

    .section-header {
      display: grid;
      gap: 8px;
      max-width: 820px;
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--muted);
      font-family: "Lora", Georgia, serif;
      font-size: 16px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .chapter-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .content-card {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 18px;
    }

    .content-card p {
      color: var(--muted);
      font-size: 14px;
    }

    .content-card:nth-child(even) .card-label {
      color: var(--green);
    }

    .card-actions {
      margin-top: 14px;
    }

    .card-actions a {
      border-color: #C7D8F3;
      background: #FFFFFF;
      color: var(--blue);
    }

    .note {
      margin-top: 28px;
      border-top: 1px solid var(--border);
      padding-top: 18px;
      color: var(--muted);
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .content-grid,
      .chapter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .wrap {
        width: min(100% - 24px, 1120px);
      }

      .hero {
        min-height: 540px;
        background-position: center top;
      }

      .content-grid,
      .chapter-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header class="hero">
    <div class="wrap hero-content">
      <p class="kicker">Página ponte no GitHub Pages</p>
      <h1>${escapeHtml(COURSE_TITLE)}</h1>
      <p>${escapeHtml(DEFAULT_SITE_DESCRIPTION)}</p>
      <nav class="actions" aria-label="Acessos principais">
        <a href="${SITE_URL}/home.html">Apresentação oficial</a>
        <a href="${SITE_URL}/">Abrir app</a>
        <a href="${SITE_URL}/conteudo.html">Mapa de conteúdo</a>
        <a href="${GITHUB_REPOSITORY_URL}">Repositório GitHub</a>
      </nav>
      <div class="hero-stats" aria-label="Resumo do conteúdo">
        <div class="hero-stat"><strong>${chapters.length}</strong><span>capítulos</span></div>
        <div class="hero-stat"><strong>${topicCount}</strong><span>tópicos diretos</span></div>
        <div class="hero-stat"><strong>${simulatorCatalog.length}</strong><span>simuladores</span></div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section class="section-block" aria-labelledby="principal-heading">
      <div class="section-header">
        <p class="section-label">Versão canônica</p>
        <h2 id="principal-heading">A experiência principal está na Vercel</h2>
        <p>Esta página existe para facilitar descoberta pública e referência acadêmica. A página canônica, indicada aos buscadores, é a landing oficial do TERMO na Vercel.</p>
      </div>
      <div class="content-grid">
        <article class="content-card">
          <p class="card-label">Landing oficial</p>
          <h3>Apresentação do TERMO</h3>
          <p>Página estática com resumo do projeto, capítulos, pontos, simulados, desafio do dia, simuladores e links diretos para o material didático.</p>
          <div class="card-actions">
            <a href="${SITE_URL}/home.html">Abrir landing</a>
          </div>
        </article>
        <article class="content-card">
          <p class="card-label">App</p>
          <h3>Livro interativo</h3>
          <p>Interface principal para estudar capítulos, resolver exercícios, acumular pontos e acessar simulados IA.</p>
          <div class="card-actions">
            <a href="${SITE_URL}/">Abrir app</a>
          </div>
        </article>
        <article class="content-card">
          <p class="card-label">Mapa</p>
          <h3>Conteúdo rastreável</h3>
          <p>Lista textual de páginas, seções, simulados e simuladores, pensada para navegação direta e descoberta por buscadores.</p>
          <div class="card-actions">
            <a href="${SITE_URL}/conteudo.html">Abrir mapa</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section-block" aria-labelledby="chapters-heading">
      <div class="section-header">
        <p class="section-label">Capítulos</p>
        <h2 id="chapters-heading">Percursos de estudo em Termodinâmica</h2>
        <p>Os capítulos conectam fundamentos, potenciais termodinâmicos, estatística, transições de fase, processos e ciclos.</p>
      </div>
      <div class="chapter-grid">
${chapterCards}
      </div>
    </section>

    <section class="section-block" aria-labelledby="simulators-heading">
      <div class="section-header">
        <p class="section-label">Simuladores</p>
        <h2 id="simulators-heading">Recursos interativos</h2>
        <p>Simulações independentes para explorar modelos, parâmetros e comportamento físico de sistemas termodinâmicos.</p>
      </div>
      <div class="content-grid">
${simulatorCards}
      </div>
    </section>

    <p class="note">${escapeHtml(COURSE_TITLE)} é um projeto didático de ${escapeHtml(AUTHOR_NAME)} no ${escapeHtml(PUBLISHER_NAME)}. Página canônica: <a href="${SITE_URL}/home.html">${SITE_URL}/home.html</a>.</p>
  </main>
</body>
</html>
`;
}

async function writeContentPage(topicMap) {
  await writeFile(path.join(rootDir, "conteudo.html"), buildContentPage(topicMap), "utf8");
}

async function writeHomePage(topicMap) {
  await writeFile(path.join(rootDir, "home.html"), buildHomePage(topicMap), "utf8");
}

async function writeGithubPagesBridge(topicMap) {
  const docsDir = path.join(rootDir, "docs");
  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${xmlEscape(`${GITHUB_PAGES_URL}/`)}</loc>`,
    "  </url>",
    "</urlset>"
  ].join("\n");

  await mkdir(docsDir, { recursive: true });
  await writeFile(path.join(docsDir, ".nojekyll"), "", "utf8");
  await writeFile(path.join(docsDir, "index.html"), buildGithubPagesBridge(topicMap), "utf8");
  await writeFile(path.join(docsDir, "sitemap.xml"), `${sitemapXml}\n`, "utf8");
}

const topicMap = await loadTopicMap();
const htmlFiles = [path.join(rootDir, "index.html"), path.join(rootDir, "INSTRUCOES_SNIPPET.html"), ...(await collectHtmlFiles(slidesDir))];

for (const filePath of htmlFiles) {
  await processHtmlFile(filePath, topicMap);
}

await writeHomePage(topicMap);
await writeContentPage(topicMap);
await writeGithubPagesBridge(topicMap);
await writeRobotsFile();
await writeSitemaps(topicMap, htmlFiles);

console.log(`SEO atualizado em ${htmlFiles.length} HTMLs, home.html, conteudo.html, docs/index.html, robots.txt, sitemap.xml, sitemap.txt e cópias de compatibilidade.`);
