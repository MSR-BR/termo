function buildPublicConfig(env = process.env) {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || "";
  const supabasePublishableKey = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const googleClientId = env.PUBLIC_GOOGLE_CLIENT_ID || "";

  return {
    authEnabled: Boolean(supabaseUrl && supabasePublishableKey && googleClientId),
    supabaseUrl,
    supabasePublishableKey,
    googleClientId
  };
}

export async function handlePublicConfigRequest({
  method,
  env = process.env
}) {
  if (!["GET", "HEAD"].includes(method || "GET")) {
    return {
      status: 405,
      body: { error: "Use GET." }
    };
  }

  return {
    status: 200,
    body: buildPublicConfig(env)
  };
}

