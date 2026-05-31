import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import {
  handleExerciseRequest,
  handleExerciseValidationAdminRequest,
  handleExerciseValidationRequest
} from "./lib/exercicio-handler.mjs";
import { handlePublicConfigRequest } from "./lib/public-config-handler.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

function parseEnvFile(content) {
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      entries[key] = value;
    }
  }

  return entries;
}

async function loadLocalEnv() {
  const envPath = path.join(rootDir, ".env.local");

  try {
    const content = await readFile(envPath, "utf8");
    const parsed = parseEnvFile(content);
    Object.assign(process.env, parsed);
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }
}

await loadLocalEnv();

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function resolveFilePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = decodedPath === "/" ? "/index.html" : decodedPath;
  const candidate = path.normalize(path.join(rootDir, normalized));

  if (!candidate.startsWith(rootDir)) {
    return null;
  }

  return candidate;
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("JSON invalido.");
  }
}

async function serveStaticFile(req, res) {
  const filePath = resolveFilePath(req.url || "/");
  if (!filePath) {
    sendText(res, 403, "Acesso negado.");
    return;
  }

  try {
    const fileStats = await stat(filePath);
    const targetPath = fileStats.isDirectory()
      ? path.join(filePath, "index.html")
      : filePath;
    const content = await readFile(targetPath);
    const extension = path.extname(targetPath).toLowerCase();
    const contentType = mimeTypes[extension] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": extension === ".json" ? "no-store" : "no-cache"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(content);
  } catch {
    sendText(res, 404, "Arquivo nao encontrado.");
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = req.url || "/";

  if (requestUrl.startsWith("/_vercel/insights/")) {
    sendText(res, 200, "", "application/javascript; charset=utf-8");
    return;
  }

  if (requestUrl === "/api/exercicio") {
    try {
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      const response = await handleExerciseRequest({
        method: req.method,
        body,
        env: process.env
      });

      sendJson(res, response.status, response.body);
    } catch (error) {
      sendJson(res, 400, {
        error: "Nao foi possivel ler o corpo da requisicao.",
        details: String(error)
      });
    }
    return;
  }

  if (requestUrl === "/api/exercicio-validacao") {
    try {
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      const response = await handleExerciseValidationRequest({
        method: req.method,
        body,
        headers: req.headers,
        env: process.env
      });

      sendJson(res, response.status, response.body);
    } catch (error) {
      sendJson(res, 400, {
        error: "Nao foi possivel ler o corpo da requisicao.",
        details: String(error)
      });
    }
    return;
  }

  if (requestUrl.startsWith("/api/exercicio-validacao-admin")) {
    try {
      const url = new URL(requestUrl, `http://${host}:${port}`);
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      const response = await handleExerciseValidationAdminRequest({
        method: req.method,
        body,
        headers: req.headers,
        query: Object.fromEntries(url.searchParams.entries()),
        env: process.env
      });

      sendJson(res, response.status, response.body);
    } catch (error) {
      sendJson(res, 400, {
        error: "Nao foi possivel ler a requisicao de revisao.",
        details: String(error)
      });
    }
    return;
  }

  if (requestUrl === "/api/public-config") {
    const response = await handlePublicConfigRequest({
      method: req.method,
      env: process.env
    });

    sendJson(res, response.status, response.body);
    return;
  }

  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendText(res, 405, "Metodo nao permitido.");
    return;
  }

  await serveStaticFile(req, res);
});

server.listen(port, host, () => {
  console.log(`Servidor local em http://${host}:${port}`);
});
