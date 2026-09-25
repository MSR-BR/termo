import { handleEmailUnsubscribeRequest } from "../lib/email-unsubscribe-handler.mjs";

export default async function handler(req, res) {
  const response = await handleEmailUnsubscribeRequest({
    method: req.method,
    body: req.body,
    env: process.env
  });
  return res.status(response.status).json(response.body);
}
