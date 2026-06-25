import { existsSync, readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_SOURCE = "/Users/marioreis/Desktop/termo.pdf";
const DEFAULT_BUCKET = "livros";
const DEFAULT_OBJECT_PATH = "termodinamica-preprint.pdf";

function loadEnvFile(path) {
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) return;

  const lines = readFileSync(resolvedPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue
      .replace(/^['"]|['"]$/g, "")
      .trim();
  }
}

function requireEnv(name, fallback = "") {
  const value = String(process.env[name] || fallback || "").trim();
  if (!value) {
    throw new Error(`Variavel ausente: ${name}`);
  }
  return value;
}

function serviceRoleKey() {
  return String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
}

function uploadEndpoint({ supabaseUrl, bucket, objectPath }) {
  const encodedPath = objectPath
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const supabaseUrl = requireEnv("PUBLIC_SUPABASE_URL");
  const key = serviceRoleKey();
  if (!key) {
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_KEY antes do upload.");
  }

  const source = process.argv[2] || process.env.LIVRO_PDF_SOURCE || DEFAULT_SOURCE;
  const bucket = process.env.LIVRO_PDF_BUCKET || DEFAULT_BUCKET;
  const objectPath = process.env.LIVRO_PDF_OBJECT_PATH || DEFAULT_OBJECT_PATH;
  const file = await readFile(source);
  const info = await stat(source);

  if (!info.isFile()) {
    throw new Error(`Fonte invalida: ${source}`);
  }

  const response = await fetch(uploadEndpoint({ supabaseUrl, bucket, objectPath }), {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/pdf",
      "Cache-Control": "3600",
      "x-upsert": "true"
    },
    body: file
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`Upload falhou (${response.status}): ${JSON.stringify(payload)}`);
  }

  console.log(JSON.stringify({
    ok: true,
    source: basename(source),
    bytes: info.size,
    bucket,
    objectPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
