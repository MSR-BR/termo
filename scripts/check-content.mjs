import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

let hasErrors = false;

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  hasErrors = true;
  console.error(`ERRO: ${message}`);
}

function warn(message) {
  console.warn(`AVISO: ${message}`);
}

async function validateChapterFile(fileName) {
  const filePath = path.join(dataDir, fileName);
  const raw = await readFile(filePath, "utf8");
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`${fileName} nao contem JSON valido: ${error}`);
    return;
  }

  if (!Array.isArray(parsed.topics)) {
    fail(`${fileName} precisa conter um array "topics".`);
    return;
  }

  if (typeof parsed.description !== "string") {
    warn(`${fileName} nao possui "description" em formato texto.`);
  }

  for (const [index, topic] of parsed.topics.entries()) {
    const label = `${fileName} -> topic ${index + 1}`;

    if (!topic || typeof topic !== "object") {
      fail(`${label} nao e um objeto valido.`);
      continue;
    }

    if (typeof topic.id !== "string" || !topic.id.trim()) {
      fail(`${label} esta sem "id".`);
    }

    if (typeof topic.title !== "string" || !topic.title.trim()) {
      fail(`${label} esta sem "title".`);
    }

    if (typeof topic.url !== "string" || !topic.url.trim()) {
      fail(`${label} esta sem "url".`);
      continue;
    }

    const targetPath = path.join(rootDir, topic.url);
    if (!(await exists(targetPath))) {
      fail(`${label} aponta para arquivo inexistente: ${topic.url}`);
    }
  }
}

const entries = await readdir(dataDir);
const chapterFiles = entries
  .filter((fileName) => /^capitulo-\d+\.json$/.test(fileName))
  .sort();

if (chapterFiles.length === 0) {
  fail("Nenhum arquivo de capitulo foi encontrado em /data.");
}

for (const fileName of chapterFiles) {
  await validateChapterFile(fileName);
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log(`Estrutura validada com sucesso: ${chapterFiles.length} arquivos de capitulo verificados.`);
}
