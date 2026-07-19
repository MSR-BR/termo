const MATH_SEGMENT_PATTERN = /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g;
const RAW_LATEX_COMMAND_PATTERN =
  /\\(?:frac|partial|Delta|Omega|mu|lambda|beta|sum|int|sqrt|cdot|ln|exp|to|rightarrow|le|ge|neq|infty|varepsilon|epsilon|kappa|theta|Theta|Phi|phi|alpha|sigma|rho)\b/;
const BARE_MATH_TOKEN_PATTERN =
  /\b(?:k_[A-Za-z0-9]+|[A-Za-z]_[A-Za-z0-9]+|[A-Za-z]\^[A-Za-z0-9]+|sum\s*\(|partial\b|d\s*\/\s*d[A-Za-z]|[A-Z][A-Za-z0-9']*\s*=\s*[^.,;\n]{1,80})\b|[∂ΔΩβλμ→≤≥±≠∞]/;
const BARE_ASSIGNMENT_PATTERN =
  /\b[A-Za-z][A-Za-z0-9']*(?:_[A-Za-z0-9]+)?\s*=\s*[^.,;\n]{1,80}/;

function normalizeText(value = "") {
  return String(value || "").replace(/\r\n?/g, "\n");
}

function maskMathSegments(value = "") {
  const segments = [];
  const masked = normalizeText(value).replace(MATH_SEGMENT_PATTERN, function (match) {
    const token = `@@TERMO_VALID_MATH_${segments.length}@@`;
    segments.push(match);
    return token;
  });

  return { masked, segments };
}

function countMatches(value = "", pattern) {
  return (String(value || "").match(pattern) || []).length;
}

function validateMathSegment(segment = "", index = 0) {
  const errors = [];
  const warnings = [];
  const display = segment.startsWith("\\[");
  const inline = segment.startsWith("\\(");
  const close = display ? "\\]" : "\\)";
  const content = segment.slice(2, -2).trim();

  if (!content) {
    errors.push({
      code: "empty_math_segment",
      message: `Segmento matematico ${index + 1} esta vazio.`
    });
  }

  if (!segment.endsWith(close)) {
    errors.push({
      code: "unclosed_math_segment",
      message: `Segmento matematico ${index + 1} nao fecha com ${close}.`
    });
  }

  if (inline && content.length > 180) {
    warnings.push({
      code: "long_inline_math",
      message: `Segmento inline ${index + 1} e longo; display math pode ser melhor.`
    });
  }

  if (/\\\(|\\\[|\\\)|\\\]/.test(content)) {
    errors.push({
      code: "nested_math_delimiters",
      message: `Segmento matematico ${index + 1} contem delimitadores aninhados.`
    });
  }

  return { errors, warnings };
}

function validateDollarUsage(text = "") {
  const errors = [];
  if (/\$\$?/.test(text)) {
    errors.push({
      code: "dollar_math_delimiter",
      message: "Use \\( ... \\) ou \\[ ... \\]; delimitadores com $ sao proibidos."
    });
  }
  return errors;
}

function validateDelimiterBalance(text = "") {
  const errors = [];
  const inlineOpen = countMatches(text, /\\\(/g);
  const inlineClose = countMatches(text, /\\\)/g);
  const displayOpen = countMatches(text, /\\\[/g);
  const displayClose = countMatches(text, /\\\]/g);

  if (inlineOpen !== inlineClose) {
    errors.push({
      code: "inline_delimiter_unbalanced",
      message: `Delimitadores inline desbalanceados: ${inlineOpen} abertura(s), ${inlineClose} fechamento(s).`
    });
  }

  if (displayOpen !== displayClose) {
    errors.push({
      code: "display_delimiter_unbalanced",
      message: `Delimitadores display desbalanceados: ${displayOpen} abertura(s), ${displayClose} fechamento(s).`
    });
  }

  return errors;
}

function validateOutsideMath(text = "") {
  const { masked } = maskMathSegments(text);
  const errors = [];
  const warnings = [];

  if (RAW_LATEX_COMMAND_PATTERN.test(masked)) {
    errors.push({
      code: "raw_latex_outside_math",
      message: "Ha comando LaTeX fora de delimitadores matematicos."
    });
  }

  if (BARE_ASSIGNMENT_PATTERN.test(masked)) {
    errors.push({
      code: "bare_assignment_outside_math",
      message: "Ha equacao ou atribuicao matematica fora de delimitadores."
    });
  }

  if (BARE_MATH_TOKEN_PATTERN.test(masked)) {
    warnings.push({
      code: "bare_math_token_outside_math",
      message: "Ha expressao com cara de matematica fora de delimitadores."
    });
  }

  if (/\[\s*[^\]\n]{1,120}[=+\-*/^_∂ΔΩβλμ→≤≥±≠∞][^\]\n]{0,120}\s*\]/.test(masked)) {
    errors.push({
      code: "bracket_math_outside_delimiters",
      message: "Ha matematica entre colchetes sem delimitadores MathJax."
    });
  }

  return { errors, warnings };
}

export function validateMathTextContract(value = "", { field = "text" } = {}) {
  const text = normalizeText(value);
  const errors = [
    ...validateDollarUsage(text),
    ...validateDelimiterBalance(text)
  ];
  const warnings = [];
  const { segments } = maskMathSegments(text);

  segments.forEach(function (segment, index) {
    const result = validateMathSegment(segment, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  const outside = validateOutsideMath(text);
  errors.push(...outside.errors);
  warnings.push(...outside.warnings);

  return {
    field,
    ok: errors.length === 0,
    errors,
    warnings,
    mathSegmentCount: segments.length
  };
}

export function validateExerciseMathContract(exercise = {}) {
  const fields = ["title", "statement", "solution"];
  const fieldResults = fields.map((field) =>
    validateMathTextContract(exercise[field] || "", { field })
  );
  const errors = fieldResults.flatMap((result) =>
    result.errors.map((error) => ({ ...error, field: result.field }))
  );
  const warnings = fieldResults.flatMap((result) =>
    result.warnings.map((warning) => ({ ...warning, field: result.field }))
  );

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    fields: fieldResults,
    mathSegmentCount: fieldResults.reduce((total, result) => total + result.mathSegmentCount, 0)
  };
}

export function summarizeMathContractResult(result = {}) {
  return {
    ok: Boolean(result.ok),
    errorCount: Array.isArray(result.errors) ? result.errors.length : 0,
    warningCount: Array.isArray(result.warnings) ? result.warnings.length : 0,
    errors: Array.isArray(result.errors)
      ? result.errors.slice(0, 6).map((error) => ({
          field: error.field || "",
          code: error.code || "",
          message: error.message || ""
        }))
      : [],
    warnings: Array.isArray(result.warnings)
      ? result.warnings.slice(0, 6).map((warning) => ({
          field: warning.field || "",
          code: warning.code || "",
          message: warning.message || ""
        }))
      : []
  };
}
