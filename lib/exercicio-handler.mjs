const difficultyGuide = {
  facil: "Exercicio conceitual, direto, sem contas longas. Deve testar compreensao basica.",
  medio: "Exercicio com interpretacao fisica e, se apropriado, uma conta simples.",
  dificil: "Exercicio com raciocinio em mais etapas, conexao entre conceitos ou calculo mais elaborado."
};

const plainMathPattern =
  /(?:\bk_[A-Za-z0-9]+|\b[A-Za-z]_[A-Za-z0-9]+|\bsum\s*\(|\bln\s*\(|\bexp\s*\(|\bpartial\b|[∂ΔΩβλμ→≤≥±≠∞]|\b[A-Z][A-Za-z0-9']*\s*=|\^[0-9²³]+|_[{(]?[A-Za-z0-9,]+[})]?)/;

function sanitizeExerciseBody(body = {}) {
  const pageContent = String(body.pageContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    ...body,
    pageTitle: String(body.pageTitle || "").trim().slice(0, 240),
    pageSubtitle: String(body.pageSubtitle || "").trim().slice(0, 320),
    pageContent: pageContent.slice(0, 9000)
  };
}

function buildPrompt({
  pageTitle = "",
  pageSubtitle = "",
  pageContent = "",
  difficulty = "medio",
  level = "graduacao em Fisica",
  language = "pt-BR"
}) {
  return `
Voce e um assistente didatico para um material de Termodinamica criado pelo Prof. Mario Reis.

Crie UM exercicio novo, em ${language}, adequado ao nivel: ${level}.

Tema da pagina:
${pageTitle}
${pageSubtitle}

Conteudo da pagina:
${pageContent}

Dificuldade escolhida: ${difficulty}.
Criterio da dificuldade: ${difficultyGuide[difficulty] || difficultyGuide.medio}

Regras obrigatorias:
- O exercicio deve estar diretamente relacionado ao conteudo da pagina.
- Nao use assuntos fora do tema da pagina.
- Nao invente dados desnecessarios.
- Se usar numeros, use valores simples.
- A solucao deve ser clara, curta e passo a passo.
- Se usar equacoes, escreva em LaTeX com delimitadores \( ... \) para inline e \[ ... \] para blocos.
- Coloque cada equacao de destaque ou passo algébrico importante em sua propria linha, usando \[ ... \].
- Nunca use $...$, $$...$$, [ ... ] solto, nem misture delimitadores como [ \( ... \) ].
- Nunca deixe formulas em texto ASCII cru, como k_B, sum(...), d/dT, partial, Z_N ou expressoes com ^ e _ fora de delimitadores LaTeX.
- Responda APENAS em JSON valido.
- Nao use markdown.
- Nao inclua comentarios fora do JSON.

Formato obrigatorio:
{
  "title": "titulo curto",
  "statement": "enunciado do exercicio",
  "solution": "solucao comentada"
}
`;
}

function needsMathFormatting(exercise = {}) {
  const combined = [exercise.title, exercise.statement, exercise.solution]
    .filter(Boolean)
    .join("\n");

  if (!combined) return false;
  if (/\\\(|\\\[/.test(combined) && !plainMathPattern.test(combined)) return false;
  return plainMathPattern.test(combined);
}

function buildMathFormattingPrompt(exercise, language = "pt-BR") {
  return `
Voce e um revisor de notacao matematica para material didatico de Termodinamica.

Reescreva o JSON abaixo preservando o conteudo, o nivel e o significado fisico, mas convertendo TODAS as expressoes matematicas para LaTeX valido.

Regras obrigatorias:
- Mantenha o idioma em ${language}.
- Preserve o texto didatico; mude apenas a forma de escrever a matematica quando necessario.
- Use \( ... \) para matematica inline.
- Use \[ ... \] para blocos de derivacao, equacoes maiores ou passos algébricos.
- Coloque cada equacao importante em linha propria e com delimitadores \[ ... \].
- Nunca use $...$, $$...$$, [ ... ] solto, nem sequencias misturadas como [ \( ... \) ].
- Nao deixe formulas em texto cru como k_B, Z_N, sum(...), d/dT, partial, expressoes com ^, _, lambda, Delta, beta ou simbolos como ∂.
- Retorne APENAS JSON valido.
- Nao use markdown fora do proprio JSON.

Formato obrigatorio:
{
  "title": "titulo curto",
  "statement": "enunciado formatado",
  "solution": "solucao formatada"
}

JSON de entrada:
${JSON.stringify(exercise)}
`;
}

function extractJsonObject(raw = "") {
  const text = String(raw || "").trim();
  const start = text.indexOf("{");

  if (start === -1) {
    return text;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return text.slice(start);
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function shouldRetryGemini(result) {
  return Boolean(result && !result.ok && [429, 503].includes(result.status));
}

async function callGeminiJson({ apiKey, model, prompt, temperature = 0.7 }) {
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
          temperature,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    return {
      ok: false,
      status: geminiResponse.status,
      data
    };
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const extracted = extractJsonObject(raw);

  try {
    return {
      ok: true,
      status: 200,
      parsed: JSON.parse(extracted)
    };
  } catch {
    return {
      ok: false,
      status: 500,
      data: {
        error: "A resposta da IA nao veio como JSON valido.",
        raw
      }
    };
  }
}

async function formatExerciseMath({ apiKey, model, exercise, language }) {
  if (!needsMathFormatting(exercise)) {
    return exercise;
  }

  const result = await callGeminiJson({
    apiKey,
    model,
    prompt: buildMathFormattingPrompt(exercise, language),
    temperature: 0.2
  });

  if (!result.ok) {
    return exercise;
  }

  const parsed = result.parsed || {};

  return {
    title: parsed.title || exercise.title || "Exercicio",
    statement: parsed.statement || exercise.statement || "",
    solution: parsed.solution || exercise.solution || ""
  };
}

export async function handleExerciseRequest({
  method,
  body,
  env = process.env
}) {
  if (method !== "POST") {
    return { status: 405, body: { error: "Use POST." } };
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "GEMINI_API_KEY nao configurada no ambiente." }
    };
  }

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallbackModel = "gemini-2.5-flash";
  const sanitizedBody = sanitizeExerciseBody(body || {});
  const prompt = buildPrompt(sanitizedBody);

  try {
    let result = await callGeminiJson({
      apiKey,
      model,
      prompt
    });

    if (
      !result.ok &&
      sanitizedBody.pageContent &&
      sanitizedBody.pageContent.length > 3500
    ) {
      result = await callGeminiJson({
        apiKey,
        model,
        prompt: buildPrompt({
          ...sanitizedBody,
          pageContent: sanitizedBody.pageContent.slice(0, 3500)
        })
      });
    }

    if (shouldRetryGemini(result)) {
      await sleep(1200);
      result = await callGeminiJson({
        apiKey,
        model,
        prompt
      });
    }

    if (!result.ok && model !== fallbackModel) {
      result = await callGeminiJson({
        apiKey,
        model: fallbackModel,
        prompt
      });
    }

    if (!result.ok) {
      return {
        status: result.status,
        body: {
          error: "Erro retornado pela API Gemini.",
          details: result.data
        }
      };
    }

    const parsed = result.parsed || {};
    const formatted = await formatExerciseMath({
      apiKey,
      model,
      language: body?.language || "pt-BR",
      exercise: {
        title: parsed.title || "Exercicio",
        statement: parsed.statement || "",
        solution: parsed.solution || ""
      }
    });

    return {
      status: 200,
      body: {
        title: formatted.title || "Exercicio",
        statement: formatted.statement || "",
        solution: formatted.solution || ""
      }
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: "Erro interno ao gerar exercicio.",
        details: String(error)
      }
    };
  }
}
