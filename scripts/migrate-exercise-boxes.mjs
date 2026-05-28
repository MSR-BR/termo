import { readFile, writeFile } from "node:fs/promises";

const files = [
  "slides/capitulo-01/page_2.html",
  "slides/capitulo-01/page_4.html",
  "slides/capitulo-01/page_5.html",
  "slides/capitulo-01/page_9.html",
  "slides/capitulo-01/page_10.html",
  "slides/capitulo-01/page_11.html",
  "slides/capitulo-01/page_14.html",
  "slides/capitulo-01/page_18.html",
  "slides/capitulo-02/page_3.html",
  "slides/capitulo-02/page_4.html",
  "slides/capitulo-02/page_5.html",
  "slides/capitulo-02/page_8.html"
];

const headInjection = [
  '<link rel="stylesheet" href="../../assets/ai-exercises.css">',
  '<script defer src="../../assets/ai-exercises.js"></script>'
].join("\n");

const placeholder = '<section data-termo-ai-exercise data-exercise-theme="purple"></section>';

function ensureAssets(html) {
  let next = html;
  next = next.replace(/<link rel="stylesheet" href="\.\.\/\.\.\/assets\/ai-exercises\.css">\s*/g, "");
  next = next.replace(/<script defer(?:="True")? src="\.\.\/\.\.\/assets\/ai-exercises\.js"><\/script>\s*/g, "");

  if (!next.includes("../../assets/ai-exercises.css")) {
    next = next.replace("</head>", `${headInjection}\n</head>`);
  }

  return next;
}

function replaceExerciseSection(html) {
  const sectionMatch = html.match(/<section[^>]*id=["']aiExerciseBox["'][^>]*>/i);
  if (!sectionMatch || sectionMatch.index == null) return html;

  const start = sectionMatch.index;
  const end = html.indexOf("</section>", start);
  if (end === -1) return html;

  return `${html.slice(0, start)}${placeholder}${html.slice(end + "</section>".length)}`;
}

function removeLegacyExerciseScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, function (block) {
    return /(newExerciseBtn|showSolutionBtn|gerarExercicio|generateAIExercise)/.test(block) ? "" : block;
  });
}

for (const file of files) {
  let html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  html = ensureAssets(html);
  html = replaceExerciseSection(html);
  html = removeLegacyExerciseScripts(html);
  await writeFile(new URL(`../${file}`, import.meta.url), html, "utf8");
}
