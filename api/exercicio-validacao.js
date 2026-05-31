import { handleExerciseValidationRequest } from "../lib/exercicio-handler.mjs";

export default async function handler(req, res) {
  const response = await handleExerciseValidationRequest({
    method: req.method,
    body: req.body,
    headers: req.headers,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}
