export default async function handler(req, res) {
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

  const difficultyGuide = {
    facil: "Exercício conceitual, direto, sem contas longas. Deve testar compreensão básica.",
    medio: "Exercício com interpretação física e, se apropriado, uma conta simples.",
    dificil: "Exercício com raciocínio em mais etapas, conexão entre conceitos ou cálculo mais elaborado."
  };

  const prompt = `
Você é um assistente didático para um material de Termodinâmica criado pelo Prof. Mario Reis.

Crie UM exercício novo, em ${language}, adequado ao nível: ${level}.

Tema da página:
${pageTitle}
${pageSubtitle}

Conteúdo da página:
${pageContent}

Dificuldade escolhida: ${difficulty}.
Critério da dificuldade: ${difficultyGuide[difficulty] || difficultyGuide.medio}

Regras obrigatórias:
- O exercício deve estar diretamente relacionado ao conteúdo da página.
- Não use assuntos fora do tema da página.
- Não invente dados desnecessários.
- Se usar números, use valores simples.
- A solução deve ser clara, curta e passo a passo.
- Responda APENAS em JSON válido.
- Não use markdown.
- Não inclua comentários fora do JSON.

Formato obrigatório:
{
  "title": "título curto",
  "statement": "enunciado do exercício",
  "solution": "solução comentada"
}
`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: "Erro retornado pela API Gemini.",
        details: data
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return res.status(500).json({
        error: "A resposta da IA não veio como JSON válido.",
        raw
      });
    }

    return res.status(200).json({
      title: parsed.title || "Exercício",
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
