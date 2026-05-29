import path from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";

const rootDir = "/Users/marioreis/Documents/Codex/2026-05-23/eu-tenho-uma-pagina-que-estou/termo";
const targets = [path.join(rootDir, "index.html")];

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      targets.push(fullPath);
    }
  }
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function buildAssetTags(filePath) {
  const relativeAssetsDir = toPosix(path.relative(path.dirname(filePath), path.join(rootDir, "assets"))) || ".";
  return [
    `<link rel="stylesheet" href="${relativeAssetsDir}/termo-auth.css">`,
    `<script defer src="${relativeAssetsDir}/termo-auth.js"></script>`
  ].join("\n");
}

async function injectIntoFile(filePath) {
  const html = await readFile(filePath, "utf8");
  if (html.includes("termo-auth.js") || html.includes("termo-auth.css")) {
    return false;
  }

  const tags = buildAssetTags(filePath);
  const updated = html.replace(/<\/head>/i, `${tags}\n</head>`);

  if (updated === html) {
    return false;
  }

  await writeFile(filePath, updated, "utf8");
  return true;
}

await collectHtmlFiles(path.join(rootDir, "slides"));

let updatedCount = 0;
for (const filePath of targets) {
  if (await injectIntoFile(filePath)) {
    updatedCount += 1;
  }
}

console.log(`Arquivos atualizados com login opcional: ${updatedCount}`);
