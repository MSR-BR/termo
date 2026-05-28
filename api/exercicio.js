import { handleExerciseRequest } from "../lib/exercicio-handler.mjs";

export default async function handler(req, res) {
  const response = await handleExerciseRequest({
    method: req.method,
    body: req.body,
    env: process.env
  });

  return res.status(response.status).json(response.body);
}
