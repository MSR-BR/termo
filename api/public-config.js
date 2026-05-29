import { handlePublicConfigRequest } from "../lib/public-config-handler.mjs";

export default async function handler(req, res) {
  const response = await handlePublicConfigRequest({
    method: req.method,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}

