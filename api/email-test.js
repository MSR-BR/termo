import { handleEmailTestRequest } from "../lib/email-test-handler.mjs";

export default async function handler(req, res) {
  const response = await handleEmailTestRequest({
    method: req.method,
    headers: req.headers,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}
