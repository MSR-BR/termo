const DEFAULT_BUCKET = "livros";
const DEFAULT_OBJECT_PATH = "termodinamica-preprint.pdf";
const DEFAULT_DOWNLOAD_FILENAME = "termodinamica-preprint.pdf";
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60;

function jsonResponse(status, body) {
  return { status, body };
}

function getSupabaseConfig(env = process.env) {
  return {
    supabaseUrl: String(env.PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""),
    publishableKey: String(env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""),
    serviceRoleKey: String(
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_SECRET_KEY ||
      env.SUPABASE_SERVICE_KEY ||
      ""
    ),
    bucket: String(env.LIVRO_PDF_BUCKET || DEFAULT_BUCKET),
    objectPath: String(env.LIVRO_PDF_OBJECT_PATH || DEFAULT_OBJECT_PATH).replace(/^\/+/, ""),
    downloadFilename: String(env.LIVRO_PDF_FILENAME || DEFAULT_DOWNLOAD_FILENAME),
    signedUrlTtlSeconds: Number(env.LIVRO_PDF_SIGNED_URL_TTL_SECONDS || DEFAULT_SIGNED_URL_TTL_SECONDS)
  };
}

function readBearerToken(headers = {}) {
  return String(headers.authorization || headers.Authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

async function fetchAuthenticatedUser({ supabaseUrl, publishableKey, accessToken }) {
  if (!supabaseUrl || !publishableKey || !accessToken) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function buildSignedUrlEndpoint({ supabaseUrl, bucket, objectPath }) {
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function normalizeSignedUrl({ supabaseUrl, signedUrl, downloadFilename }) {
  if (!signedUrl) return "";

  const url = signedUrl.startsWith("http")
    ? new URL(signedUrl)
    : new URL(signedUrl, supabaseUrl);

  if (downloadFilename && !url.searchParams.has("download")) {
    url.searchParams.set("download", downloadFilename);
  }

  return url.toString();
}

async function createSignedPdfUrl(config) {
  const endpoint = buildSignedUrlEndpoint(config);
  const expiresIn = Number.isFinite(config.signedUrlTtlSeconds)
    ? Math.max(30, Math.min(3600, Math.round(config.signedUrlTtlSeconds)))
    : DEFAULT_SIGNED_URL_TTL_SECONDS;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`
    },
    body: JSON.stringify({ expiresIn })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      details: payload?.message || payload?.error || "signed_url_failed"
    };
  }

  const signedUrl = normalizeSignedUrl({
    supabaseUrl: config.supabaseUrl,
    signedUrl: payload?.signedURL || payload?.signedUrl || "",
    downloadFilename: config.downloadFilename
  });

  return signedUrl
    ? { ok: true, signedUrl, expiresIn }
    : { ok: false, status: 500, details: "signed_url_missing" };
}

export async function handleLivroPdfRequest({
  method,
  headers = {},
  env = process.env
}) {
  if (!["GET", "HEAD"].includes(method || "GET")) {
    return jsonResponse(405, { error: "Use GET." });
  }

  const accessToken = readBearerToken(headers);
  if (!accessToken) {
    return jsonResponse(401, {
      error: "Entre com Google para baixar o PDF do livro."
    });
  }

  const config = getSupabaseConfig(env);

  if (!config.supabaseUrl || !config.publishableKey || !config.serviceRoleKey) {
    return jsonResponse(500, {
      error: "Download do PDF ainda nao configurado.",
      details: "Configure PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY no Vercel."
    });
  }

  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });

  if (!user?.id) {
    return jsonResponse(401, {
      error: "Nao foi possivel validar sua sessao. Entre novamente para baixar o PDF."
    });
  }

  const signedResult = await createSignedPdfUrl(config);
  if (!signedResult.ok) {
    return jsonResponse(signedResult.status || 500, {
      error: "Nao foi possivel preparar o download do PDF.",
      details: signedResult.details
    });
  }

  return jsonResponse(200, {
    url: signedResult.signedUrl,
    expiresIn: signedResult.expiresIn,
    filename: config.downloadFilename
  });
}
