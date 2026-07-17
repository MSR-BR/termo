import { handleChapterQuizRequest } from "../lib/chapter-quiz-handler.mjs";

export default async function handler(req, res) {
  const response = await handleChapterQuizRequest({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}
