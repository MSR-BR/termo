import { handleGamificationProfileRequest } from "../lib/gamification-profile-handler.mjs";

export default async function handler(req, res) {
  const response = await handleGamificationProfileRequest({
    method: req.method,
    headers: req.headers,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}
