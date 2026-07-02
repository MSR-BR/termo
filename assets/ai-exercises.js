(function () {
  if (window.TermoAIExercise) return;

  const inlineMathPattern = /\\\(([\s\S]+?)\\\)/g;
  const mathSegmentPattern = /\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g;
  const mathLikePattern =
    /(?:\\[A-Za-z]+|[A-Za-z]_[A-Za-z0-9]+|[A-Za-z]\^[A-Za-z0-9]+|\b(?:sum|ln|exp|lim|frac|partial|sin|cos|tan|sinh|cosh)\b|[=+\-*/^_]|[Σ∑∂ΔΩβλμ→≤≥±≠∞])/;
  const DEFAULT_VALIDATOR_EMAILS = ["marioreis@id.uff.br"];

  function sanitizeGeneratedExerciseText(value) {
    return String(value || "")
      .replace(/\b(?:conforme|como)\s+(?:estudado|apresentado|descrito|discutido)\s+(?:pelo|por)\s+(?:o\s+)?(?:prof\.?|professor)\s+mario\s+reis,?\s*/gi, "")
      .replace(/\b(?:segundo|de acordo com)\s+(?:o\s+)?(?:prof\.?|professor)\s+mario\s+reis,?\s*/gi, "")
      .replace(/\b(?:prof\.?|professor)\s+mario\s+reis\b/gi, "este material")
      .replace(/\bmario\s+reis\b/gi, "este material")
      .replace(/(^|[.!?] +)([a-zà-ÿ])/g, (_match, lead, letter) => lead + letter.toUpperCase());
  }

  function getCurrentPageReference() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
  }

  function trackAnalytics(eventName, properties) {
    try {
      window.TermoAnalytics?.track?.(eventName, properties || {});
    } catch (_error) {
      /* analytics must never block exercise generation */
    }
  }

  function getHostState(host) {
    if (!host.__termoExerciseState) {
      host.__termoExerciseState = {
        exercise: null,
        saveResult: null,
        canValidate: false
      };
    }
    return host.__termoExerciseState;
  }

  function escapeHtml(value){
    return String(value || "").replace(/[&<>"']/g, function (s) {
      return ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      })[s];
    });
  }

  function countWords(value) {
    return (
      String(value || "")
        .replace(/\\[A-Za-z]+/g, " ")
        .match(/[A-Za-zÀ-ÿ]{2,}/g) || []
    ).length;
  }

  function mathDensity(value) {
    const text = String(value || "");
    const mathChars = (text.match(/[\\=+\-*/^_{}[\]()0-9Σ∑∂ΔΩβλμ∞≤≥±≠]/g) || []).length;
    return mathChars / Math.max(text.length, 1);
  }

  function isMathy(value) {
    return mathLikePattern.test(String(value || ""));
  }

  function cleanupEquation(value) {
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

  function shouldDisplayEquation(value) {
    const text = cleanupEquation(value);
    if (!text || !isMathy(text)) return false;

    const words = countWords(text);
    const density = mathDensity(text);

    if (words <= 4) return true;
    return density > 0.18 && words <= 8;
  }

  function isSimpleInlineMath(value) {
    const text = cleanupEquation(value).replace(/[{}]/g, "").trim();
    if (!text || text.length > 36) return false;
    if (/[=+\-*/]|[→≤≥≠∑∂]|\\(?:frac|sum|lim|int|partial|sqrt|to|rightarrow|le|ge|neq|cdot|ln|exp)\b/.test(text)) return false;
    if (isMathy(text)) return true;
    return /^(?:[A-Za-z]|\\[A-Za-z]+)(?:[_^][A-Za-z0-9]+)?'?$/u.test(text);
  }

  function hasProseCue(value) {
    return /\b(?:onde|para|considere|suponha|mostre|calcule|determine|sistema|estado|temperatura|press[aã]o|energia|entropia|fun[cç][aã]o|equa[cç][aã]o|probabilidade|limite|portanto|assim|logo)\b/i.test(String(value || ""));
  }

  function convertStandaloneMathLine(line) {
    const trimmed = String(line || "").trim();
    if (!trimmed || /\\\(|\\\[/.test(trimmed)) return trimmed;

    const enumeratedMatch = trimmed.match(/^((?:\d+|[a-z])[\).:]\s+)(.+)$/i);
    const prefix = enumeratedMatch ? enumeratedMatch[1] : "";
    const content = enumeratedMatch ? enumeratedMatch[2].trim() : trimmed;

    if (/:/.test(content) && countWords(content) > 0 && !/[=+\-*/→≤≥≠]/.test(content)) {
      return trimmed;
    }

    if (!hasProseCue(content) && isSimpleInlineMath(content)) {
      return `${prefix}\\(${latexifySnippet(cleanupEquation(content))}\\)`;
    }

    if (!hasProseCue(content) && (shouldDisplayEquation(content) || (isMathy(content) && countWords(content) <= 4 && mathDensity(content) > 0.18))) {
      return `${prefix}\\[${latexifySnippet(content)}\\]`;
    }

    return trimmed;
  }

  function normalizeMathLine(rawLine) {
    const line = String(rawLine || "").trim();
    if (!line) return "";

    const bracketInlineMatch = line.match(/^\[\s*\\\(([\s\S]+?)\\\)\s*\]$/);
    if (bracketInlineMatch) {
      const cleaned = cleanupEquation(bracketInlineMatch[1]);
      return isSimpleInlineMath(cleaned) ? `\\(${latexifySnippet(cleaned)}\\)` : `\\[${cleaned}\\]`;
    }

    const bracketMathMatch = line.match(/^\[\s*([\s\S]+?)\s*\]$/);
    if (bracketMathMatch && shouldDisplayEquation(bracketMathMatch[1])) {
      const cleaned = cleanupEquation(bracketMathMatch[1]);
      return isSimpleInlineMath(cleaned) ? `\\(${latexifySnippet(cleaned)}\\)` : `\\[${cleaned}\\]`;
    }

    const displayMatch = line.match(/^\\\[\s*([\s\S]+?)\s*\\\]$/);
    if (displayMatch) {
      return `\\[${cleanupEquation(displayMatch[1])}\\]`;
    }

    const inlineMatch = line.match(/^\\\(\s*([\s\S]+?)\s*\\\)$/);
    if (inlineMatch) {
      const cleaned = cleanupEquation(inlineMatch[1]);
      return shouldDisplayEquation(cleaned) && !isSimpleInlineMath(cleaned)
        ? `\\[${cleaned}\\]`
        : `\\(${cleaned}\\)`;
    }

    if (/\\\(|\\\[/.test(line)) {
      return line;
    }

    if (/:/.test(line) && countWords(line) > 0 && !/[=+*/→≤≥≠-]/.test(line)) {
      return line;
    }

    if (countWords(line) <= 2 && shouldDisplayEquation(line)) {
      const cleaned = cleanupEquation(line);
      return isSimpleInlineMath(cleaned) ? `\\(${latexifySnippet(cleaned)}\\)` : `\\[${cleaned}\\]`;
    }

    return line;
  }

  function repairGeneratedMathDelimiters(value) {
    let text = String(value || "")
      .replace(/\r\n?/g, "\n");

    const sourceLines = text.split("\n");
    const joinedLines = [];
    let pendingInline = "";
    sourceLines.forEach(function (rawLine, index) {
      const raw = String(rawLine || "");
      if (pendingInline && !raw.trim()) {
        joinedLines.push(pendingInline + "\\)");
        joinedLines.push(raw);
        pendingInline = "";
        return;
      }

      const line = pendingInline ? pendingInline + " " + raw.trim() : raw;
      const inlineOpen = (line.match(/\\\(/g) || []).length;
      const inlineClose = (line.match(/\\\)/g) || []).length;
      if (inlineOpen > inlineClose) {
        const nextLine = String(sourceLines[index + 1] || "");
        const continuesMath = /^\s*(?:[.,;:+\-*/=})\]]|\d|\\[A-Za-z])/.test(nextLine);
        if (!nextLine.trim() || !continuesMath) {
          joinedLines.push(line + "\\)");
          pendingInline = "";
        } else {
          pendingInline = line;
        }
        return;
      }

      joinedLines.push(line);
      pendingInline = "";
    });
    if (pendingInline) joinedLines.push(pendingInline + "\\)");

    text = joinedLines
      .join("\n")
      .replace(/(\d)\s+\.(\d)/g, "$1.$2")
      .replace(/\\\(\s*\\\)/g, "")
      .replace(/\\\[\s*\\\]/g, "");

    let output = "";
    let cursor = 0;
    let inlineBalance = 0;
    let displayBalance = 0;
    const tokenPattern = /\\[()[\]]/g;
    let match;
    while ((match = tokenPattern.exec(text))) {
      output += text.slice(cursor, match.index);
      const token = match[0];
      if (token === "\\(") {
        inlineBalance += 1;
        output += token;
      } else if (token === "\\)") {
        if (inlineBalance > 0) {
          inlineBalance -= 1;
          output += token;
        }
      } else if (token === "\\[") {
        displayBalance += 1;
        output += token;
      } else if (token === "\\]") {
        if (displayBalance > 0) {
          displayBalance -= 1;
          output += token;
        }
      }
      cursor = match.index + token.length;
    }
    output += text.slice(cursor);

    if (displayBalance > 0) output += "\\]".repeat(displayBalance);
    if (inlineBalance > 0) output += "\\)".repeat(inlineBalance);
    return output;
  }

  function replaceOutsideMathSegments(value, transform) {
    const tokens = [];
    const masked = String(value || "").replace(mathSegmentPattern, function (match) {
      const token = "@@TERMO_MATH_" + tokens.length + "@@";
      tokens.push(match);
      return token;
    });

    return transform(masked).replace(/@@TERMO_MATH_(\d+)@@/g, function (_match, index) {
      return tokens[Number(index)] || "";
    });
  }

  function wrapBareLatexExpressions(value) {
    const latexCommand = /\\(?:left|right|frac|partial|kappa|lambda|mu|Delta|Omega|sum|int|sqrt|cdot|text|mathrm|to|rightarrow|le|ge|neq|infty|varepsilon|epsilon|beta|gamma|theta|Theta|Phi|phi|alpha|sigma|rho|ln|exp)(?![A-Za-z])/;
    const latexRun = /(^|[^A-Za-zÀ-ÿ\\])((?:(?:\\(?:text|mathrm)\s*\{[^}]*\})|(?:\\[A-Za-z]+)|(?:[A-Za-z](?![A-Za-zÀ-ÿ]))|(?:\d+(?:\.\d+)?)|[\s_{}()[\]=+\-*/<>.,]){4,})(?=$|[^A-Za-zÀ-ÿ])/g;

    return replaceOutsideMathSegments(value, function (segment) {
      return segment.replace(latexRun, function (match, lead, candidate) {
        if (!latexCommand.test(candidate)) return match;
        const cleaned = cleanupEquation(candidate);
        if (!cleaned || !latexCommand.test(cleaned)) return match;
        return lead + "\\(" + cleaned + "\\)";
      });
    });
  }

  function separateAdjacentMathAndText(value) {
    return String(value || "")
      .replace(/(\\\)|\\\])(?=[A-Za-zÀ-ÿ])/g, "$1 ")
      .replace(/([,.;:])(?=\\\(|\\\[)/g, "$1 ")
      .replace(/([A-Za-zÀ-ÿ])(?=\\\(|\\\[)/g, "$1 ");
  }

  function wrapBareMathTokens(value) {
    return replaceOutsideMathSegments(wrapBareLatexExpressions(value), function (segment) {
      return segment
        .replace(/(^|[^A-Za-zÀ-ÿ\\])([A-Za-z])_([A-Za-z0-9]+)\b/g, function (_match, lead, symbol, subscript) {
          return lead + "\\(" + symbol + "_{" + subscript + "}\\)";
        })
        .replace(/(^|[^A-Za-zÀ-ÿ\\])([A-Za-z])\^([A-Za-z0-9]+)\b/g, function (_match, lead, symbol, superscript) {
          return lead + "\\(" + symbol + "^{" + superscript + "}\\)";
        });
    });
  }

  function normalizeGeneratedMath(value) {
    const normalized = wrapBareMathTokens(
      repairGeneratedMathDelimiters(sanitizeGeneratedExerciseText(value))
        .replace(/\r\n?/g, "\n")
      .replace(/\\\\/g, "\\")
      .replace(/^\s*```(?:latex|tex)?\s*$/gim, "")
      .replace(/^\s*```\s*$/gm, "")
      .replace(/\$\$([\s\S]+?)\$\$/g, function (_match, equation) {
        return `\n\\[${cleanupEquation(equation)}\\]\n`;
      })
      .replace(/(^|[^\\])\$([^$\n]+?)\$/g, function (_match, lead, equation) {
        return `${lead}\\(${cleanupEquation(equation)}\\)`;
      })
      .replace(/\\\(\s*\$([^$]+)\$\s*\\\)/g, function (_match, equation) {
        return `\\(${cleanupEquation(equation)}\\)`;
      })
      .replace(/\[\s*\\\(([\s\S]+?)\\\)\s*\]/g, function (_match, equation) {
        return `\n\\[${cleanupEquation(equation)}\\]\n`;
      })
      .split("\n")
      .map(function (line) {
        return normalizeMathLine(convertStandaloneMathLine(line.trimEnd()));
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    );
    return separateAdjacentMathAndText(normalized);
  }

  function latexifySnippet(snippet) {
    return snippet
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
      .replace(/\\partial\s*\/\s*\\partial\s*([A-Za-z])/g, "\\frac{\\partial}{\\partial $1}")
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

  function autoFormatPlainMath(paragraph) {
    let formatted = paragraph;

    formatted = formatted.replace(
      /\[\s*([^\[\]\n]{3,180})\s*\]/g,
      function (match, snippet) {
        if (!isMathy(snippet)) return match;
        return "\\(" + latexifySnippet(snippet) + "\\)";
      }
    );

    formatted = formatted.replace(
      /\(\s*([A-Za-z](?:_[A-Za-z0-9]+)?)\s*\)/g,
      function (_match, snippet) {
        return "\\(" + latexifySnippet(snippet) + "\\)";
      }
    );

    formatted = formatted.replace(
      /\(([^()]{0,60}[→=][^()]{0,60})\)/g,
      function (_match, snippet) {
        if (/\\\(|\\\[/.test(snippet)) return "(" + snippet + ")";
        return "\\(" + latexifySnippet(snippet) + "\\)";
      }
    );

    formatted = formatted.replace(
      /([A-Za-z][A-Za-z0-9']*(?:_[A-Za-z0-9]+)?\s*=\s*[^.,;()\n]+)(?=[.,;()\n]|$)/g,
      function (match, snippet, offset, source) {
        const previous = source.slice(Math.max(0, offset - 2), offset);
        if (previous === "\\(" || previous === "\\[") return match;
        return "\\(" + latexifySnippet(snippet) + "\\)";
      }
    );

    return formatted;
  }

  function protectMathSegments(text) {
    const tokens = [];
    const masked = String(text || "").replace(mathSegmentPattern, function (match) {
      const key = `@@TERMO_MATH_${tokens.length}@@`;
      tokens.push(escapeHtml(match));
      return key;
    });

    return { masked, tokens };
  }

  function restoreMathSegments(text, tokens) {
    return String(text || "").replace(/@@TERMO_MATH_(\d+)@@/g, function (_match, index) {
      return tokens[Number(index)] || "";
    });
  }

  function renderInlineMarkup(text) {
    const protectedText = protectMathSegments(text);
    const mathAware = autoFormatPlainMath(protectedText.masked);
    const escaped = escapeHtml(mathAware)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^\w*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    return restoreMathSegments(escaped, protectedText.tokens);
  }

  function tokenizeGeneratedText(value) {
    const normalized = normalizeGeneratedMath(value);
    if (!normalized) return [];

    const blocks = [];
    const lines = normalized.split("\n");
    let paragraphLines = [];
    let displayLines = [];

    function flushParagraph() {
      if (!paragraphLines.length) return;
      const text = paragraphLines.join("\n").trim();
      if (text) {
        blocks.push({ type: "paragraph", value: text });
      }
      paragraphLines = [];
    }

    function flushDisplay() {
      if (!displayLines.length) return;
      const text = displayLines.join("\n").trim();
      if (text) {
        blocks.push({ type: "math", value: text });
      }
      displayLines = [];
    }

    lines.forEach(function (rawLine) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushDisplay();
        return;
      }

      if (displayLines.length) {
        displayLines.push(trimmed);
        if (/\\\]\s*$/.test(trimmed)) {
          flushDisplay();
        }
        return;
      }

      if (/^\\\[/.test(trimmed)) {
        flushParagraph();
        displayLines.push(trimmed);
        if (/\\\]\s*$/.test(trimmed)) {
          flushDisplay();
        }
        return;
      }

      paragraphLines.push(trimmed);
    });

    flushParagraph();
    flushDisplay();
    return blocks;
  }

  function normalizeExercisePayload(data) {
    const payload = data || {};
    return {
      ...payload,
      title: normalizeGeneratedMath(payload.title || "Exercício").replace(/\s+/g, " ").trim() || "Exercício",
      statement: normalizeGeneratedMath(payload.statement || ""),
      solution: normalizeGeneratedMath(payload.solution || "")
    };
  }

  function formatGeneratedText(value) {
    return tokenizeGeneratedText(value)
      .map(function (block) {
        if (block.type === "math") {
          return `<div class="termo-exercise__math-block">${escapeHtml(block.value)}</div>`;
        }

        return `<p>${renderInlineMarkup(block.value).replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  async function typesetMath(elements) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") return;

    try {
      if (typeof window.MathJax.typesetClear === "function") {
        window.MathJax.typesetClear(elements);
      }
      await window.MathJax.typesetPromise(elements);
    } catch (error) {
      console.warn("Nao foi possivel compor as equacoes do exercicio.", error);
    }
  }

  async function readApiPayload(response) {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return {
      error: text || `HTTP ${response.status}`
    };
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = node && node.innerText ? node.innerText.trim() : "";
      if (text) return text;
    }
    return "";
  }

  function collapseText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function collectRelevantText(root) {
    const selectors = [
      ".chapter-title",
      ".chapter-text",
      ".hdr-title",
      ".hdr-sub",
      ".title-main-heading",
      ".title-main-slide-heading",
      ".title-main-header",
      ".main-title",
      ".ch",
      ".card-heading",
      ".section-heading",
      ".body-t",
      ".body-text",
      ".content-paragraph-block",
      ".concept-text-block",
      ".text-paragraph",
      ".theory-text-block",
      ".theory-card-text",
      ".thermo-theory-card-text",
      ".thermo-provocation-body",
      ".topic-note",
      "p",
      "li"
    ];

    const fragments = [];
    const seen = new Set();

    root.querySelectorAll(selectors.join(",")).forEach(function (node) {
      const text = collapseText(node.innerText || node.textContent || "");
      if (!text || seen.has(text)) return;
      seen.add(text);
      fragments.push(text);
    });

    return collapseText(fragments.join("\n\n"));
  }

  function getPageContext(host){
    const title = firstText([
      ".chapter-title",
      ".hdr-title",
      ".title-main-heading",
      ".title-main-slide-heading",
      ".title-main-header",
      ".main-title",
      "h1"
    ]) || document.title || "";

    const subtitle = firstText([
      ".chapter-text",
      ".hdr-sub",
      ".title-section-label",
      ".title-label-section",
      ".title-section-label",
      ".topic-kicker",
      ".sub-title"
    ]);

    const sourceSelector = host.dataset.exerciseContextSelector;
    const sourceNode =
      (sourceSelector && document.querySelector(sourceSelector)) ||
      document.querySelector(".slide, .content-root, .body, .page, main, .slide-root, .slide-root-container, .slide-root-canvas") ||
      document.querySelector(".content-root, .page, main, .slide-root, .slide-root-container, .slide-root-canvas, body") ||
      document.body;

    const clone = sourceNode.cloneNode(true);
    clone.querySelectorAll([
      "[data-termo-ai-exercise]",
      ".termo-exercise",
      "#aiExerciseBox",
      ".ai-exercise-card",
      ".termo-auth-trigger",
      ".termo-auth-overlay",
      ".termo-share-button",
      ".index-back-button",
      "script",
      "style",
      "noscript"
    ].join(", ")).forEach(function (node) {
      node.remove();
    });

    const relevantContent = collectRelevantText(clone);
    const fallbackContent = collapseText(clone.innerText || clone.textContent || "");
    const content = (relevantContent || fallbackContent).slice(0, 4500);

    return { title, subtitle, content };
  }

  function getChapterMeta() {
    const label = firstText([".chapter-label"]);
    const match = label.match(/Capítulo\s+(\d+)\s*·\s*Item\s+([0-9.]+)/i);

    return {
      chapterId: match ? match[1].padStart(2, "0") : "",
      itemId: match ? match[2] : "",
      label
    };
  }

  async function canProfessorValidate() {
    if (!window.TermoAuth?.getSession) return false;

    try {
      const [session, config] = await Promise.all([
        window.TermoAuth.getSession(),
        window.TermoAuth.fetchConfig ? window.TermoAuth.fetchConfig().catch(function () { return null; }) : Promise.resolve(null)
      ]);
      const email = String(session?.user?.email || "").trim().toLowerCase();
      const validatorEmails = Array.isArray(config?.validatorEmails) && config.validatorEmails.length
        ? config.validatorEmails.map(function (value) {
            return String(value || "").trim().toLowerCase();
          }).filter(Boolean)
        : DEFAULT_VALIDATOR_EMAILS;

      return Boolean(email && validatorEmails.includes(email));
    } catch (_error) {
      return false;
    }
  }

  function setSaveStatus(host, message, tone) {
    const node = host.querySelector('[data-role="save-status"]');
    if (!node) return;

    if (!message) {
      node.hidden = true;
      node.textContent = "";
      node.classList.remove("is-success", "is-warning", "is-error");
      return;
    }

    node.hidden = false;
    node.textContent = message;
    node.classList.remove("is-success", "is-warning", "is-error");
    if (tone) {
      node.classList.add(`is-${tone}`);
    }
  }

  function setValidationStatus(host, message, tone) {
    const node = host.querySelector('[data-role="validation-status"]');
    if (!node) return;

    if (!message) {
      node.hidden = true;
      node.textContent = "";
      node.classList.remove("is-success", "is-warning", "is-error");
      return;
    }

    node.hidden = false;
    node.textContent = message;
    node.classList.remove("is-success", "is-warning", "is-error");
    if (tone) {
      node.classList.add(`is-${tone}`);
    }
  }

  function setMemoryStatus(host, message, tone) {
    const node = host.querySelector('[data-role="memory-status"]');
    if (!node) return;

    if (!message) {
      node.hidden = true;
      node.textContent = "";
      node.classList.remove("is-success", "is-warning");
      return;
    }

    node.hidden = false;
    node.textContent = message;
    node.classList.remove("is-success", "is-warning");
    if (tone) {
      node.classList.add(`is-${tone}`);
    }
  }

  function buildExerciseRecord(ctx, data, difficultyValue) {
    const chapter = getChapterMeta();
    const pageReference = getCurrentPageReference();

    return {
      chapterId: chapter.chapterId,
      itemId: chapter.itemId,
      pagePath: pageReference,
      pageUrl: pageReference,
      pageTitle: ctx.title || document.title || "Página do curso",
      difficulty: difficultyValue,
      exerciseCode: data.exerciseId || "",
      exerciseTitle: data.title || "Exercício",
      statement: data.statement || "",
      solution: data.solution || "",
      sourceModel: data.model || null
    };
  }

  async function persistExercise(host, record) {
    if (!window.TermoUserData || typeof window.TermoUserData.saveExercise !== "function") {
      setSaveStatus(host, "", "");
      return { saved: false, reason: "user_data_not_available" };
    }

    try {
      const result = await window.TermoUserData.saveExercise(record);

      if (result.saved) {
        setSaveStatus(host, "Exercício salvo em Meus exercícios.", "success");
        return result;
      }

      if (result.reason === "not_authenticated") {
        setSaveStatus(host, "Entre com Google para guardar este exercício em Meus exercícios.", "warning");
        return result;
      }

      if (result.reason === "auth_not_configured") {
        setSaveStatus(host, "", "");
        return result;
      }

      console.warn("Nao foi possivel salvar o exercicio.", result.error || result.reason);
      setSaveStatus(host, "Nao foi possivel salvar este exercício agora.", "error");
      return result;
    } catch (error) {
      console.warn("Falha ao salvar o exercicio gerado.", error);
      setSaveStatus(host, "Nao foi possivel salvar este exercício agora.", "error");
      return { saved: false, reason: "unexpected_error", error };
    }
  }

  function syncValidationNoteVisibility(host) {
    ["statement", "solution"].forEach(function (scope) {
      const checked = host.querySelector(`input[name="${scope}-validation-${host.dataset.exerciseIdSuffix}"]:checked`);
      const noteBox = host.querySelector(`[data-role="${scope}-note-box"]`);
      if (!noteBox) return;
      const shouldOpen = checked && checked.value === "sim";
      noteBox.hidden = !shouldOpen;
    });
  }

  function resetValidationForm(host) {
    host.querySelectorAll('[data-role="validation-choice"]').forEach(function (input) {
      input.checked = false;
    });
    host.querySelectorAll('[data-role="validation-note"]').forEach(function (input) {
      input.value = "";
    });
    host.querySelectorAll(".termo-exercise__validation-note-box").forEach(function (box) {
      box.hidden = true;
    });
    setValidationStatus(host, "", "");
  }

  async function refreshValidationVisibility(host) {
    const toggle = host.querySelector('[data-role="toggle-validation"]');
    const panel = host.querySelector('[data-role="validation-panel"]');
    if (!toggle || !panel) return;

    const state = getHostState(host);
    const ready = Boolean(state.exercise && state.exercise.statement && state.exercise.solution);
    state.canValidate = ready;
    const visible = ready;

    toggle.hidden = !visible;
    panel.hidden = !visible || panel.hidden;
    if (!visible) {
      panel.hidden = true;
      setValidationStatus(host, "", "");
    }
  }

  async function submitValidation(host) {
    const state = getHostState(host);
    if (!state.exercise) {
      setValidationStatus(host, "Gere um exercício antes de validar.", "warning");
      return;
    }

    const session = await window.TermoAuth?.getSession?.().catch(function () {
      return null;
    });
    const accessToken = session?.access_token;
    if (!accessToken) {
      setValidationStatus(host, "Entre com Google para enviar a validação.", "warning");
      return;
    }

    const statementStatus = host.querySelector(`input[name="statement-validation-${host.dataset.exerciseIdSuffix}"]:checked`)?.value || "";
    const solutionStatus = host.querySelector(`input[name="solution-validation-${host.dataset.exerciseIdSuffix}"]:checked`)?.value || "";
    const statementNote = (host.querySelector('[data-role="statement-note"]')?.value || "").trim();
    const solutionNote = (host.querySelector('[data-role="solution-note"]')?.value || "").trim();

    if (!statementStatus || !solutionStatus) {
      setValidationStatus(host, "Preencha a avaliação do enunciado e da solução.", "warning");
      return;
    }

    if (statementStatus === "sim" && !statementNote) {
      setValidationStatus(host, "Descreva em uma frase o problema do enunciado.", "warning");
      return;
    }

    if (solutionStatus === "sim" && !solutionNote) {
      setValidationStatus(host, "Descreva em uma frase o problema da solução.", "warning");
      return;
    }

    const button = host.querySelector('[data-role="submit-validation"]');
    const ctx = state.exercise.context || getPageContext(host);
    const chapter = getChapterMeta();
    const pageReference = getCurrentPageReference();

    try {
      if (button) button.disabled = true;
      setValidationStatus(host, "Enviando para revisão do professor...", "warning");

      const response = await fetch("/api/exercicio-validacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chapterId: chapter.chapterId,
          itemId: chapter.itemId,
          exerciseId: state.exercise.exerciseId || "",
          pagePath: pageReference,
          pageUrl: pageReference,
          pageTitle: ctx.title || document.title || "Página do curso",
          pageSubtitle: ctx.subtitle || "",
          pageContent: ctx.content || "",
          difficulty: state.exercise.difficulty || "medio",
          savedExerciseId: state.saveResult?.record?.id || "",
          exerciseTitle: state.exercise.title || "Exercício",
          statement: state.exercise.statement || "",
          solution: state.exercise.solution || "",
          statementStatus,
          solutionStatus,
          statementNote,
          solutionNote,
          language: "pt-BR"
        })
      });

      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(
          payload?.details?.message ||
          payload?.details?.error_description ||
          payload?.details?.error ||
          payload?.error ||
          `Erro HTTP ${response.status}`
        );
      }

      setValidationStatus(
        host,
        payload.summary || "Relato enviado para análise do professor.",
        "success"
      );
      trackAnalytics("exercise_validation_success", {
        difficulty: state.exercise.difficulty || "",
        statement_status: statementStatus,
        solution_status: solutionStatus
      });
    } catch (error) {
      console.warn("Nao foi possivel enviar a validacao do exercicio.", error);
      trackAnalytics("exercise_validation_error", { message: error?.message || "validation_error" });
      setValidationStatus(host, error && error.message ? error.message : "Nao foi possivel registrar a validação agora.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderShell(host) {
    const selectId = `termo-exercise-select-${Math.random().toString(36).slice(2, 10)}`;
    const validationSuffix = Math.random().toString(36).slice(2, 10);
    const title = host.dataset.exerciseTitle || "Exercício";
    const theme = host.dataset.exerciseTheme || "purple";
    const levelLabel = host.dataset.exerciseLevelLabel || "Nível";

    host.dataset.exerciseMounted = "true";
    host.dataset.exerciseIdSuffix = validationSuffix;
    host.classList.add("termo-exercise");
    host.setAttribute("data-exercise-theme", theme);
    host.innerHTML = `
      <div class="termo-exercise__top">
        <div class="termo-exercise__title">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          ${escapeHtml(title)}
        </div>

        <div class="termo-exercise__controls">
          <div class="termo-exercise__level">
            <label class="termo-exercise__level-label" for="${selectId}">${escapeHtml(levelLabel)}</label>
            <select class="termo-exercise__select" id="${selectId}" data-role="difficulty">
              <option value="facil">Fácil</option>
              <option selected value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>

          <button class="termo-exercise__btn" data-role="generate" type="button">Novo exercício</button>
          <button class="termo-exercise__btn termo-exercise__btn--secondary" data-role="toggle-solution" type="button" disabled>Ver solução</button>
        </div>
      </div>

      <div class="termo-exercise__disclaimer">
        <strong>Aviso importante:</strong> todo o conteúdo didático das páginas e do livro associado foi criado pelo autor do material.
        O aplicativo de criação de exercícios é um experimento didático; os exercícios e soluções serão gerados automaticamente por IA e
        <strong>podem conter erros conceituais, matemáticos ou pedagógicos</strong>. Erros detectados devem ser comunicados para
        <a href="mailto:marioreis@id.uff.br">marioreis@id.uff.br</a>.
      </div>

      <div class="termo-exercise__save-status" data-role="save-status" hidden></div>
      <div class="termo-exercise__memory-status" data-role="memory-status" hidden></div>

      <div class="termo-exercise__body">
        <div class="termo-exercise__panel termo-exercise__output" data-role="output">
          <div class="termo-exercise__panel-title">
            <i class="fa-solid fa-circle-question"></i>
            Enunciado
          </div>
          <div class="termo-exercise__content termo-exercise__placeholder" data-role="output-content">
            <p>Escolha o nível e clique em <strong>Novo exercício</strong>.</p>
          </div>
        </div>

        <div class="termo-exercise__panel termo-exercise__solution" data-role="solution-panel">
          <div class="termo-exercise__panel-title termo-exercise__panel-title--solution">
            <i class="fa-solid fa-check"></i>
            Solução
          </div>
          <div class="termo-exercise__content termo-exercise__placeholder" data-role="solution-content">
            <p>A solução aparecerá aqui após a geração do exercício.</p>
          </div>
        </div>
      </div>

      <div class="termo-exercise__validation-tools">
        <button class="termo-exercise__btn termo-exercise__btn--validation" data-role="toggle-validation" type="button" hidden>
          <i class="fa-solid fa-shield-check"></i>
          Validação do exercício
        </button>
      </div>

      <div class="termo-exercise__validation-panel" data-role="validation-panel" hidden>
        <div class="termo-exercise__validation-header">
          <div class="termo-exercise__validation-title">
            <i class="fa-solid fa-graduation-cap"></i>
            Relato de validação do exercício
          </div>
          <div class="termo-exercise__validation-copy">Marque se o enunciado ou a solução contêm erros. Se marcar <strong>sim</strong>, descreva o problema em uma única frase.</div>
        </div>

        <div class="termo-exercise__validation-grid">
          <div class="termo-exercise__validation-group">
            <div class="termo-exercise__validation-label">Enunciado contém erros?</div>
            <div class="termo-exercise__validation-options">
              <label class="termo-exercise__validation-option">
                <input type="radio" name="statement-validation-${validationSuffix}" value="sim" data-role="validation-choice">
                <span>Sim</span>
              </label>
              <label class="termo-exercise__validation-option">
                <input type="radio" name="statement-validation-${validationSuffix}" value="nao" data-role="validation-choice">
                <span>Não</span>
              </label>
              <label class="termo-exercise__validation-option">
                <input type="radio" name="statement-validation-${validationSuffix}" value="nao_sei" data-role="validation-choice">
                <span>Não sei</span>
              </label>
            </div>
            <div class="termo-exercise__validation-note-box" data-role="statement-note-box" hidden>
              <textarea class="termo-exercise__validation-note" data-role="statement-note" rows="2" maxlength="220" placeholder="Descreva o erro do enunciado em uma frase."></textarea>
            </div>
          </div>

          <div class="termo-exercise__validation-group">
            <div class="termo-exercise__validation-label">Solução contém erros?</div>
            <div class="termo-exercise__validation-options">
              <label class="termo-exercise__validation-option">
                <input type="radio" name="solution-validation-${validationSuffix}" value="sim" data-role="validation-choice">
                <span>Sim</span>
              </label>
              <label class="termo-exercise__validation-option">
                <input type="radio" name="solution-validation-${validationSuffix}" value="nao" data-role="validation-choice">
                <span>Não</span>
              </label>
              <label class="termo-exercise__validation-option">
                <input type="radio" name="solution-validation-${validationSuffix}" value="nao_sei" data-role="validation-choice">
                <span>Não sei</span>
              </label>
            </div>
            <div class="termo-exercise__validation-note-box" data-role="solution-note-box" hidden>
              <textarea class="termo-exercise__validation-note" data-role="solution-note" rows="2" maxlength="220" placeholder="Descreva o erro da solução em uma frase."></textarea>
            </div>
          </div>
        </div>

        <div class="termo-exercise__validation-actions">
          <button class="termo-exercise__btn termo-exercise__btn--validation-submit" data-role="submit-validation" type="button">
            Enviar validação
          </button>
        </div>

        <div class="termo-exercise__validation-status" data-role="validation-status" hidden></div>
      </div>
    `;
  }

  async function generate(host) {
    const generateBtn = host.querySelector('[data-role="generate"]');
    const toggleBtn = host.querySelector('[data-role="toggle-solution"]');
    const difficulty = host.querySelector('[data-role="difficulty"]');
    const output = host.querySelector('[data-role="output-content"]');
    const solution = host.querySelector('[data-role="solution-content"]');
    const solutionPanel = host.querySelector('[data-role="solution-panel"]');
    const outputTitle = host.querySelector('[data-role="output"] .termo-exercise__panel-title');
    const level = host.dataset.exerciseLevel || "graduação em Física";
    const hostState = getHostState(host);

    if (!generateBtn || !toggleBtn || !difficulty || !output || !solution || !solutionPanel || !outputTitle) return;

    const ctx = getPageContext(host);
    const chapter = getChapterMeta();
    generateBtn.disabled = true;
    toggleBtn.disabled = true;
    solutionPanel.style.display = "none";
    hostState.exercise = null;
    hostState.saveResult = null;
    resetValidationForm(host);
    setMemoryStatus(host, "", "");
    await refreshValidationVisibility(host);

    outputTitle.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Gerando exercício
    `;
    output.classList.add("termo-exercise__placeholder");
    output.innerHTML = "<p>Aguarde alguns segundos...</p>";
    solution.classList.add("termo-exercise__placeholder");
    solution.innerHTML = "<p>A solução aparecerá aqui após a geração do exercício.</p>";
    setSaveStatus(host, "", "");

    try {
      const response = await fetch("/api/exercicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.chapterId,
          itemId: chapter.itemId,
          pagePath: window.location.pathname,
          pageTitle: ctx.title,
          pageSubtitle: ctx.subtitle,
          pageContent: ctx.content,
          difficulty: difficulty.value,
          language: "pt-BR",
          level
        })
      });

      const data = await readApiPayload(response);
      if (!response.ok) {
        const apiError = new Error(
          data?.details?.error?.message ||
          data?.details?.error ||
          data?.details?.message ||
          data?.error ||
          `Erro HTTP ${response.status}`
        );
        apiError.status = response.status;
        apiError.reason = data?.reason || "";
        apiError.payload = data || null;
        throw apiError;
      }

      const cleanData = normalizeExercisePayload(data);

      outputTitle.innerHTML = `
        <i class="fa-solid fa-circle-question"></i>
        <span class="termo-exercise__generated-title">${escapeHtml(cleanData.title || "Exercício")}</span>
        ${cleanData.exerciseId ? `<span class="termo-exercise__id-chip">${escapeHtml(cleanData.exerciseId)}</span>` : ""}
      `;
      output.classList.remove("termo-exercise__placeholder");
      output.innerHTML = formatGeneratedText(cleanData.statement || "A API não retornou um enunciado.");

      solution.classList.remove("termo-exercise__placeholder");
      solution.innerHTML = formatGeneratedText(cleanData.solution || "A API não retornou uma solução.");

      await typesetMath([output, solution]);
      toggleBtn.disabled = !(cleanData.solution || "").trim();
      hostState.exercise = {
        title: cleanData.title || "Exercício",
        exerciseId: cleanData.exerciseId || "",
        statement: cleanData.statement || "",
        solution: cleanData.solution || "",
        difficulty: difficulty.value,
        context: ctx
      };
      hostState.saveResult = await persistExercise(host, buildExerciseRecord(ctx, cleanData, difficulty.value));
      trackAnalytics("exercise_generate_success", {
        difficulty: difficulty.value,
        exercise_id: cleanData.exerciseId || "",
        validation_memory_count: Number(data.validationMemoryCount || 0)
      });
      if (hostState.canValidate && Number(data.validationMemoryCount || 0) > 0) {
        setMemoryStatus(
          host,
          `Esta geração considerou ${Number(data.validationMemoryCount)} correção(ões) já confirmada(s) para este item.`,
          "success"
        );
      } else {
        setMemoryStatus(host, "", "");
      }
      resetValidationForm(host);
      await refreshValidationVisibility(host);
    } catch (error) {
      const errorMessage = error && error.message ? error.message : "Falha ao chamar a API de exercícios.";
      const isTemporaryProviderIssue =
        error?.status === 429 ||
        error?.status === 503 ||
        error?.reason === "gemini_temporarily_unavailable" ||
        /temporariamente|ocupad|demanda|high demand|try again|rate limit|indispon/i.test(errorMessage);
      const isConfigurationIssue =
        /GEMINI_API_KEY|configurad|api\/exercicio\.js|publicado no Vercel/i.test(errorMessage) ||
        (error?.status >= 500 && !isTemporaryProviderIssue);

      trackAnalytics("exercise_generate_error", {
        difficulty: difficulty?.value || "",
        status: error?.status || 0,
        reason: error?.reason || "",
        temporary: Boolean(isTemporaryProviderIssue)
      });

      outputTitle.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Não foi possível gerar o exercício
      `;
      output.classList.add("termo-exercise__placeholder");
      output.innerHTML = `
        <p><strong>Erro retornado:</strong> ${escapeHtml(errorMessage)}</p>
        ${
          isTemporaryProviderIssue
            ? "<p>O servidor já tentou novamente e também testou modelos alternativos. Aguarde alguns segundos e clique em <strong>Novo exercício</strong> outra vez.</p>"
            : isConfigurationIssue
              ? "<p>Verifique a publicação no Vercel, o endpoint <strong>api/exercicio.js</strong> e a variável <strong>GEMINI_API_KEY</strong>.</p>"
              : "<p>Tente novamente. Se o erro persistir, revise a configuração do endpoint de exercícios.</p>"
        }
      `;
      setSaveStatus(host, "", "");
      setMemoryStatus(host, "", "");
      hostState.exercise = null;
      hostState.saveResult = null;
      resetValidationForm(host);
      await refreshValidationVisibility(host);
    } finally {
      generateBtn.disabled = false;
    }
  }

  function mount(host) {
    if (!host || host.dataset.exerciseMounted === "true") return;
    renderShell(host);

    const generateBtn = host.querySelector('[data-role="generate"]');
    const toggleBtn = host.querySelector('[data-role="toggle-solution"]');
    const solutionPanel = host.querySelector('[data-role="solution-panel"]');
    const validationToggle = host.querySelector('[data-role="toggle-validation"]');
    const validationPanel = host.querySelector('[data-role="validation-panel"]');
    const validationSubmit = host.querySelector('[data-role="submit-validation"]');

    if (generateBtn) {
      generateBtn.addEventListener("click", function () {
        generate(host);
      });
    }

    if (toggleBtn && solutionPanel) {
      toggleBtn.addEventListener("click", function () {
        const nextVisible = solutionPanel.style.display !== "block";
        solutionPanel.style.display = nextVisible ? "block" : "none";
        trackAnalytics(nextVisible ? "exercise_solution_open" : "exercise_solution_close", {
          difficulty: host.querySelector('[data-role="difficulty"]')?.value || ""
        });
      });
    }

    host.querySelectorAll('[data-role="validation-choice"]').forEach(function (input) {
      input.addEventListener("change", function () {
        syncValidationNoteVisibility(host);
      });
    });

    if (validationToggle && validationPanel) {
      validationToggle.addEventListener("click", function () {
        validationPanel.hidden = !validationPanel.hidden;
      });
    }

    if (validationSubmit) {
      validationSubmit.addEventListener("click", function () {
        trackAnalytics("exercise_validation_submit", {
          difficulty: host.querySelector('[data-role="difficulty"]')?.value || ""
        });
        submitValidation(host);
      });
    }

    if (window.TermoUserData?.onAuthStateChange) {
      window.TermoUserData.onAuthStateChange(function () {
        void refreshValidationVisibility(host);
      });
    }

    void refreshValidationVisibility(host);
  }

  function autoMount(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-termo-ai-exercise]").forEach(function (host) {
      mount(host);
    });
  }

  window.TermoAIExercise = {
    mount,
    autoMount,
    formatGeneratedText,
    normalizeExercisePayload,
    normalizeGeneratedMath
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      autoMount(document);
    });
  } else {
    autoMount(document);
  }
})();
