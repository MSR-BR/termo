import { handleLearningEvaluationReportRequest } from "../lib/learning-evaluation-report-handler.mjs";

export default async function handler(req, res) {
  const response = await handleLearningEvaluationReportRequest({
    method: req.method,
    headers: req.headers,
    query: req.query,
    env: process.env
  });
  return res.status(response.status).json(response.body);
}
