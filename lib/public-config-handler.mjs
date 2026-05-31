function buildPublicConfig(env = process.env) {
  const supabaseUrl = env.PUBLIC_SUPABASE_URL || "";
  const supabasePublishableKey = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const googleClientId = env.PUBLIC_GOOGLE_CLIENT_ID || "";
  const validatorEmails = ["marioreis@id.uff.br"];

  return {
    authEnabled: Boolean(supabaseUrl && supabasePublishableKey && googleClientId),
    supabaseUrl,
    supabasePublishableKey,
    googleClientId,
    validatorEmails
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
