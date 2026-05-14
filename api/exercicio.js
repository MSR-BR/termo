export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "API de exercícios ativa. Use POST." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY não configurada no Vercel." });
  }

  const {
    pageTitle = "",
    pageSubtitle = "",
    pageContent = "",
    difficulty = "medio",
    level = "graduação em Física",
    language = "pt-BR"
  } = req.body || {};

  const prompt = `
Você é um assistente didático para um material de Termodinâmica criado pelo Prof. Mario Reis.

Crie UM exercício novo, em ${language}, adequado ao nível: ${level}.

Tema da página:
${pageTitle}
${pageSubtitle}

Conteúdo da página:
${pageContent}

Dificuldade escolhida: ${difficulty}.

Critérios de dificuldade:
- facil: exercício conceitual, direto, sem contas longas.
- medio: exercício com interpretação física e, se apropriado, uma conta simples.
- dificil: exercício com raciocínio em mais etapas, conexão entre conceitos ou cálculo mais elaborado.

Regras:
- O exercício deve estar diretamente relacionado ao conteúdo da página.
- Não invente dados desnecessários.
- A solução deve ser clara, curta e passo a passo.
- Responda APENAS em JSON válido, sem markdown.

Formato obrigatório:
{
  "title": "título curto",
  "statement": "enunciado do exercício",
  "solution": "solução comentada"
}
`;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: "Erro na API Gemini.",
        details: data
      });
    }

    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        title: "Exercício gerado",
        statement: raw || "Não foi possível interpretar a resposta da IA.",
        solution: "A solução não foi retornada em formato estruturado. Gere um novo exercício."
      };
    }

    return res.status(200).json({
      title: parsed.title || "Exercício gerado",
      statement: parsed.statement || "",
      solution: parsed.solution || ""
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao gerar exercício.",
      details: String(error)
    });
  }
}
