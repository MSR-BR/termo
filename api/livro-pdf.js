import { handleLivroPdfRequest } from "../lib/livro-pdf-handler.mjs";

export default async function handler(req, res) {
  const response = await handleLivroPdfRequest({
    method: req.method,
    headers: req.headers,
    env: process.env
  });

  res.setHeader("Cache-Control", "no-store");
  return res.status(response.status).json(response.body);
}
