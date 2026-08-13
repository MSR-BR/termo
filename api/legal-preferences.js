import { handleLegalPreferencesRequest } from "../lib/legal-preferences-handler.mjs";

export default async function handler(req, res) {
  const response = await handleLegalPreferencesRequest({
    method: req.method,
    headers: req.headers,
    body: req.body,
    env: process.env
  });
  return res.status(response.status).json(response.body);
}
