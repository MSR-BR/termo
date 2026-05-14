export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY não configurada." });
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

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4",
        input: prompt
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json({
        error: "Erro na API de IA.",
        details: data
      });
    }

    const raw =
      data.output_text ||
      (data.output || [])
        .flatMap(item => item.content || [])
        .map(part => part.text || "")
        .join("\n");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        title: "Exercício gerado",
        statement: raw || "Não foi possível interpretar a resposta da IA.",
        solution: "A solução não foi retornada em formato estruturado."
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
