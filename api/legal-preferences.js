import { handleLegalPreferencesRequest } from "../lib/legal-preferences-handler.mjs";
import { handleEmailUnsubscribeRequest } from "../lib/email-unsubscribe-handler.mjs";

export default async function handler(req, res) {
  const response = req.query?.action === "unsubscribe"
    ? await handleEmailUnsubscribeRequest({
      method: req.method,
      body: req.body,
      env: process.env
    })
    : await handleLegalPreferencesRequest({
      method: req.method,
      headers: req.headers,
      body: req.body,
      env: process.env
    });
  return res.status(response.status).json(response.body);
}
