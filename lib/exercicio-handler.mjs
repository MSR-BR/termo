const difficultyGuide = {
  facil: "Exercicio conceitual, direto, sem contas longas. Deve testar compreensao basica.",
  medio: "Exercicio com interpretacao fisica e, se apropriado, uma conta simples.",
  dificil: "Exercicio com raciocinio em mais etapas, conexao entre conceitos ou calculo mais elaborado."
};

const MAX_PAGE_CONTENT_CHARS = 4500;

const plainMathPattern =
  /(?:\bk_[A-Za-z0-9]+|\b[A-Za-z]_[A-Za-z0-9]+|\bsum\s*\(|\bln\s*\(|\bexp\s*\(|\bpartial\b|[∂ΔΩβλμ→≤≥±≠∞]|\b[A-Z][A-Za-z0-9']*\s*=|\^[0-9²³]+|_[{(]?[A-Za-z0-9,]+[})]?)/;

function cleanupEquation(value = "") {
  return String(value || "")
    .replace(/^\s*\\\[/, "")
    .replace(/\\\]\s*$/, "")
    .replace(/^\s*\\\(/, "")
    .replace(/\\\)\s*$/, "")
    .replace(/^\s*\[\s*/, "")
    .replace(/\s*\]\s*$/, "")
    .replace(/^\s*\$+/, "")
    .replace(/\$+\s*$/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\\\\/g, "\\")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function countWords(value = "") {
  return (
    String(value || "")
      .replace(/\\[A-Za-z]+/g, " ")
      .match(/[A-Za-zÀ-ÿ]{2,}/g) || []
  ).length;
}

function mathDensity(value = "") {
  const text = String(value || "");
  const mathChars = (text.match(/[\\=+\-*/^_{}[\]()0-9Σ∑∂ΔΩβλμ∞≤≥±≠]/g) || []).length;
  return mathChars / Math.max(text.length, 1);
}

function looksMathy(value = "") {
  return plainMathPattern.test(String(value || "")) || /[=+\-*/^_]/.test(String(value || ""));
}

function hasProseCue(value = "") {
  return /\b(?:onde|para|considere|suponha|mostre|calcule|determine|sistema|estado|temperatura|press[aã]o|energia|entropia|fun[cç][aã]o|equa[cç][aã]o|probabilidade|limite|portanto|assim|logo)\b/i.test(String(value || ""));
}

function latexifySnippet(snippet = "") {
  return String(snippet || "")
    .replace(/([A-Za-z])_([A-Za-z0-9]+)/g, "$1_{$2}")
    .replace(/([A-Za-z0-9}])\^([A-Za-z0-9]+)/g, "$1^{$2}")
    .replace(/³/g, "^{3}")
    .replace(/²/g, "^{2}")
    .replace(/->/g, "\\to ")
    .replace(/∂/g, "\\partial ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/λ/g, "\\lambda ")
    .replace(/β/g, "\\beta ")
    .replace(/Ω/g, "\\Omega ")
    .replace(/μ/g, "\\mu ")
    .replace(/ε/g, "\\varepsilon ")
    .replace(/→/g, "\\to ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\neq ")
    .replace(/∞/g, "\\infty ")
    .replace(/\bd\s*\/\s*d\s*([A-Za-z])/g, "\\frac{d}{d $1}")
    .replace(/\bpartial\b/g, "\\partial ")
    .replace(/(\\[A-Za-z]+)\s*_([A-Za-z0-9]+)/g, "$1_{$2}")
    .replace(/\bsum_([A-Za-z0-9{}]+)/g, "\\sum_{$1}")
    .replace(/\blim_([A-Za-z0-9{}]+)/g, "\\lim_{$1}")
    .replace(/\bsum\s*\(/g, "\\sum(")
    .replace(/\bln\s*\(/g, "\\ln(")
    .replace(/\bexp\s*\(/g, "\\exp(")
    .replace(/\*/g, " \\cdot ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStandaloneMathLine(line = "") {
  const trimmed = String(line || "").trim();
  if (!trimmed || /\\\(|\\\[/.test(trimmed)) return trimmed;

  const bracketInlineMatch = trimmed.match(/^\[\s*\\\(([\s\S]+?)\\\)\s*\]$/);
  if (bracketInlineMatch) {
    return `\\[${cleanupEquation(bracketInlineMatch[1])}\\]`;
  }

  const bracketMathMatch = trimmed.match(/^\[\s*([\s\S]+?)\s*\]$/);
  if (bracketMathMatch && looksMathy(bracketMathMatch[1])) {
    return `\\[${latexifySnippet(cleanupEquation(bracketMathMatch[1]))}\\]`;
  }

  const enumeratedMatch = trimmed.match(/^((?:\d+|[a-z])[\).:]\s+)(.+)$/i);
  const prefix = enumeratedMatch ? enumeratedMatch[1] : "";
  const content = enumeratedMatch ? enumeratedMatch[2].trim() : trimmed;

  if (!hasProseCue(content) && looksMathy(content) && (countWords(content) <= 4 || mathDensity(content) > 0.18)) {
    return `${prefix}\\[${latexifySnippet(cleanupEquation(content))}\\]`;
  }

  return trimmed;
}

function normalizeMathText(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\\\\/g, "\\")
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, equation) => `\n\\[${cleanupEquation(equation)}\\]\n`)
    .replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_match, lead, equation) => `${lead}\\(${cleanupEquation(equation)}\\)`)
    .replace(/\\\(\s*\$([^$]+)\$\s*\\\)/g, (_match, equation) => `\\(${cleanupEquation(equation)}\\)`)
    .replace(/\[\s*\\\(([\s\S]+?)\\\)\s*\]/g, (_match, equation) => `\n\\[${cleanupEquation(equation)}\\]\n`)
    .replace(/\[\s*([^[\]\n]{3,180})\s*\]/g, function (match, snippet) {
      if (!looksMathy(snippet)) return match;
      return `\\(${latexifySnippet(snippet)}\\)`;
    })
    .replace(/([A-Za-z][A-Za-z0-9']*(?:_[A-Za-z0-9]+)?\s*=\s*[^.,;\n]+)(?=[.,;\n]|$)/g, function (_match, snippet) {
      return `\\(${latexifySnippet(snippet)}\\)`;
    })
    .split("\n")
    .map((line) => normalizeStandaloneMathLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeExerciseMathLocally(exercise = {}) {
  return {
    title: normalizeMathText(exercise.title || "Exercicio"),
    statement: normalizeMathText(exercise.statement || ""),
    solution: normalizeMathText(exercise.solution || "")
  };
}

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
    pageContent: pageContent.slice(0, MAX_PAGE_CONTENT_CHARS)
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
- Se uma linha for predominantemente matematica, devolva a linha inteira como bloco \[ ... \].
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

function requiresRemoteMathRefinement(exercise = {}) {
  const combined = [exercise.title, exercise.statement, exercise.solution]
    .filter(Boolean)
    .join("\n");

  if (!combined) return false;

  const unresolvedPatterns = [
    /\bsum\s*\(/,
    /\bk_[A-Za-z0-9]+/,
    /\b[A-Za-z]_[A-Za-z0-9]+/,
    /\bpartial\b/,
    /\bd\/d[A-Za-z]/,
    /\[\s*[^\]]*[=+\-*/^_∂ΔΩβλμ→≤≥±≠∞][^\]]*\]/,
    /\$\$?/,
    /\[ *\\\(/,
    /\\\(\s*[^)]+\s*\\\)\s*\\\(/,
    /\\\[[^\]]*\\\[[^\]]*\\\]/
  ];

  return unresolvedPatterns.some((pattern) => pattern.test(combined));
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
- Se uma linha estiver essencialmente matematica, devolva essa linha inteira como bloco \[ ... \].
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
    const rawExercise = {
      title: parsed.title || "Exercicio",
      statement: parsed.statement || "",
      solution: parsed.solution || ""
    };

    let normalized = normalizeExerciseMathLocally(rawExercise);

    if (requiresRemoteMathRefinement(normalized) && needsMathFormatting(rawExercise)) {
      const formatted = await formatExerciseMath({
        apiKey,
        model,
        language: body?.language || "pt-BR",
        exercise: rawExercise
      });
      normalized = normalizeExerciseMathLocally(formatted);
    }

    return {
      status: 200,
      body: {
        title: normalized.title || "Exercicio",
        statement: normalized.statement || "",
        solution: normalized.solution || ""
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
