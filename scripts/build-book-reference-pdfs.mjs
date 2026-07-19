import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const CORPUS_PATH = resolve(ROOT_DIR, "data/book-section-corpus.json");
const OUTPUT_DIR = resolve(ROOT_DIR, "output/pdf/book-reference");
const DEFAULT_PDF_PATH = process.env.TERMO_LIVRO_PDF_PATH || "/Users/marioreis/Downloads/termodinamica-preprint.pdf";
const PYTHON_BIN = process.env.TERMO_BOOK_PYTHON || process.env.PYTHON || "python3";

function parseArgs(argv) {
  const args = {
    chapterId: "02",
    itemId: "2.3",
    pdfPath: DEFAULT_PDF_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = argv[index + 1] || "";
    if (value === "--chapter" && next) {
      args.chapterId = String(next).padStart(2, "0");
      index += 1;
    } else if (value === "--section" && next) {
      args.itemId = String(next);
      index += 1;
    } else if (value === "--pdf" && next) {
      args.pdfPath = resolve(next);
      index += 1;
    }
  }

  return args;
}

function safeFilePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writePdfRange({ pdfPath, outputPath, pageStart, pageEnd }) {
  const script = `
import sys
from pypdf import PdfReader, PdfWriter

source, destination, start_raw, end_raw = sys.argv[1:5]
start = int(start_raw)
end = int(end_raw)
reader = PdfReader(source)
writer = PdfWriter()
for page_number in range(start, end + 1):
    writer.add_page(reader.pages[page_number - 1])
with open(destination, "wb") as file:
    writer.write(file)
`.trim();

  const result = spawnSync(PYTHON_BIN, ["-c", script, pdfPath, outputPath, String(pageStart), String(pageEnd)], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `Falha ao gerar ${outputPath}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.pdfPath)) {
    throw new Error(`PDF fonte nao encontrado: ${args.pdfPath}`);
  }
  if (!existsSync(CORPUS_PATH)) {
    throw new Error(`Corpus nao encontrado: ${CORPUS_PATH}`);
  }

  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const chapter = (corpus.chapters || []).find(function (entry) {
    return String(entry.chapterId || "").padStart(2, "0") === args.chapterId;
  });
  const section = (corpus.sections || []).find(function (entry) {
    return String(entry.chapterId || "").padStart(2, "0") === args.chapterId && String(entry.itemId || "") === args.itemId;
  });

  if (!chapter) throw new Error(`Capitulo nao encontrado no corpus: ${args.chapterId}`);
  if (!section) throw new Error(`Secao nao encontrada no corpus: ${args.chapterId}/${args.itemId}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const chapterOutput = resolve(OUTPUT_DIR, `termo-capitulo-${args.chapterId}-${safeFilePart(chapter.pdfChapterTitle || chapter.chapterTitle)}.pdf`);
  const sectionOutput = resolve(OUTPUT_DIR, `termo-capitulo-${args.chapterId}-secao-${safeFilePart(args.itemId)}-${safeFilePart(section.topicTitle)}.pdf`);

  writePdfRange({
    pdfPath: args.pdfPath,
    outputPath: chapterOutput,
    pageStart: chapter.pageStart,
    pageEnd: chapter.pageEnd
  });
  writePdfRange({
    pdfPath: args.pdfPath,
    outputPath: sectionOutput,
    pageStart: section.pageStart,
    pageEnd: section.pageEnd
  });

  console.log(JSON.stringify({
    ok: true,
    source: args.pdfPath,
    chapter: {
      id: args.chapterId,
      pages: [chapter.pageStart, chapter.pageEnd],
      output: chapterOutput
    },
    section: {
      id: args.itemId,
      title: section.topicTitle,
      pages: [section.pageStart, section.pageEnd],
      output: sectionOutput
    }
  }, null, 2));
}

main();
