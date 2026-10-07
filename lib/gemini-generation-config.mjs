export function buildGeminiGenerationConfig({ model, temperature }) {
  const config = { responseMimeType: "application/json" };

  // Os modelos 2.5 ainda usam a temperatura específica de cada tarefa.
  // Aliases móveis e modelos futuros recebem apenas campos estáveis.
  if (/^gemini-2\.5-/.test(String(model || ""))) {
    config.temperature = temperature;
  }

  return config;
}
