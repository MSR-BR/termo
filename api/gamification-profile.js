import { handleGamificationProfileRequest } from "../lib/gamification-profile-handler.mjs";
import { handleLearningEvaluationReportRequest } from "../lib/learning-evaluation-report-handler.mjs";

export default async function handler(req, res) {
  const response = req.query?.action === "evaluation-report"
    ? await handleLearningEvaluationReportRequest({
      method: req.method,
      headers: req.headers,
      query: req.query,
      env: process.env
    })
    : await handleGamificationProfileRequest({
      method: req.method,
      headers: req.headers,
      env: process.env
    });

  return res.status(response.status).json(response.body);
}
