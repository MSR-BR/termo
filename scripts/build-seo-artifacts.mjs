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

async function writeSitemap(topicMap, htmlFiles) {
  const urls = new Map();
  urls.set(`${SITE_URL}/`, { priority: "1.0", changefreq: "weekly" });
  urls.set(`${SITE_URL}/?view=simulators`, { priority: "0.8", changefreq: "weekly" });

  const activeChapterIds = new Set();

  for (const topic of topicMap.values()) {
    if (topic.chapterId) activeChapterIds.add(topic.chapterId);
  }

  for (const filePath of htmlFiles) {
    const relativePath = toPosix(path.relative(rootDir, filePath));
    const chapterId = getSlideChapterId(relativePath);
    if (chapterId) activeChapterIds.add(chapterId);
  }

  for (const chapterId of Object.keys(chapterCatalog).sort()) {
    if (!activeChapterIds.has(chapterId)) continue;
    urls.set(`${SITE_URL}/?view=chapters&chapter=${chapterId}`, { priority: "0.9", changefreq: "weekly" });
  }

  for (const [relativeUrl] of topicMap.entries()) {
    urls.set(`${SITE_URL}/${relativeUrl}`, { priority: "0.7", changefreq: "monthly" });
  }

  for (const filePath of htmlFiles) {
    const relativePath = toPosix(path.relative(rootDir, filePath));
    if (!getSlideChapterId(relativePath)) continue;
    urls.set(`${SITE_URL}/${relativePath}`, { priority: "0.7", changefreq: "monthly" });
  }

  const body = Array.from(urls.entries())
    .map(([url, meta]) => [
      "  <url>",
      `    <loc>${xmlEscape(url)}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${meta.changefreq}</changefreq>`,
      `    <priority>${meta.priority}</priority>`,
      "  </url>"
    ].join("\n"))
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>"
  ].join("\n");

  await writeFile(path.join(rootDir, "sitemap.xml"), `${xml}\n`, "utf8");
}

const topicMap = await loadTopicMap();
const htmlFiles = [path.join(rootDir, "index.html"), path.join(rootDir, "INSTRUCOES_SNIPPET.html"), ...(await collectHtmlFiles(slidesDir))];

for (const filePath of htmlFiles) {
  await processHtmlFile(filePath, topicMap);
}

await writeRobotsFile();
await writeSitemap(topicMap, htmlFiles);

console.log(`SEO atualizado em ${htmlFiles.length} HTMLs, robots.txt e sitemap.xml.`);
