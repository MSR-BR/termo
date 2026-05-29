(function () {
  if (window.TermoAIExercise) return;

  const inlineMathPattern = /\\\(([\s\S]+?)\\\)/g;
  const mathSegmentPattern = /\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g;
  const mathLikePattern =
    /(?:\\[A-Za-z]+|[A-Za-z]_[A-Za-z0-9]+|[A-Za-z]\^[A-Za-z0-9]+|\b(?:sum|ln|exp|lim|frac|partial)\b|[=+\-*/^_]|[Σ∑∂ΔΩβλμ→≤≥±≠∞])/;

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

  function normalizeMathLine(rawLine) {
    const line = String(rawLine || "").trim();
    if (!line) return "";

    const bracketInlineMatch = line.match(/^\[\s*\\\(([\s\S]+?)\\\)\s*\]$/);
    if (bracketInlineMatch) {
      return `\\[${cleanupEquation(bracketInlineMatch[1])}\\]`;
    }

    const bracketMathMatch = line.match(/^\[\s*([\s\S]+?)\s*\]$/);
    if (bracketMathMatch && shouldDisplayEquation(bracketMathMatch[1])) {
      return `\\[${cleanupEquation(bracketMathMatch[1])}\\]`;
    }

    const displayMatch = line.match(/^\\\[\s*([\s\S]+?)\s*\\\]$/);
    if (displayMatch) {
      return `\\[${cleanupEquation(displayMatch[1])}\\]`;
    }

    const inlineMatch = line.match(/^\\\(\s*([\s\S]+?)\s*\\\)$/);
    if (inlineMatch) {
      const cleaned = cleanupEquation(inlineMatch[1]);
      return shouldDisplayEquation(cleaned)
        ? `\\[${cleaned}\\]`
        : `\\(${cleaned}\\)`;
    }

    if (countWords(line) <= 2 && shouldDisplayEquation(line)) {
      return `\\[${cleanupEquation(line)}\\]`;
    }

    return line;
  }

  function normalizeGeneratedMath(value) {
    return String(value || "")
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
        return normalizeMathLine(line.trimEnd());
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function latexifySnippet(snippet) {
    return snippet
      .replace(/([A-Za-z])_([A-Za-z0-9]+)/g, "$1_{$2}")
      .replace(/³/g, "^{3}")
      .replace(/²/g, "^{2}")
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
      .replace(/\bsum\s*\(/g, "\\sum(")
      .replace(/\bln\s*\(/g, "\\ln(")
      .replace(/\bexp\s*\(/g, "\\exp(")
      .replace(/\*/g, " \\cdot ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function autoFormatPlainMath(paragraph) {
    if (/\\\(|\\\[/.test(paragraph)) {
      return paragraph;
    }

    let formatted = paragraph;

    formatted = formatted.replace(
      /([A-Za-z][A-Za-z0-9']*(?:_[A-Za-z0-9]+)?\s*=\s*[^.,;\n]+)(?=[.,;\n]|$)/g,
      function (_match, snippet) {
        return `\\(${latexifySnippet(snippet)}\\)`;
      }
    );

    formatted = formatted.replace(
      /\(([^()]{0,60}[→=][^()]{0,60})\)/g,
      function (_match, snippet) {
        if (/\\\(|\\\[/.test(snippet)) return `(${snippet})`;
        return `\\(${latexifySnippet(snippet)}\\)`;
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
    const mathAware = autoFormatPlainMath(text);
    const protectedText = protectMathSegments(mathAware);
    const escaped = escapeHtml(protectedText.masked)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

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
    const content = (relevantContent || fallbackContent).slice(0, 9000);

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

  function buildExerciseRecord(ctx, data, difficultyValue) {
    const chapter = getChapterMeta();

    return {
      chapterId: chapter.chapterId,
      itemId: chapter.itemId,
      pagePath: window.location.pathname,
      pageUrl: window.location.href,
      pageTitle: ctx.title || document.title || "Página do curso",
      difficulty: difficultyValue,
      exerciseTitle: data.title || "Exercício",
      statement: data.statement || "",
      solution: data.solution || "",
      sourceModel: data.model || null
    };
  }

  async function persistExercise(host, record) {
    if (!window.TermoUserData || typeof window.TermoUserData.saveExercise !== "function") {
      setSaveStatus(host, "", "");
      return;
    }

    try {
      const result = await window.TermoUserData.saveExercise(record);

      if (result.saved) {
        setSaveStatus(host, "Exercício salvo em Meus exercícios.", "success");
        return;
      }

      if (result.reason === "not_authenticated") {
        setSaveStatus(host, "Entre com Google para guardar este exercício em Meus exercícios.", "warning");
        return;
      }

      if (result.reason === "auth_not_configured") {
        setSaveStatus(host, "", "");
        return;
      }

      console.warn("Nao foi possivel salvar o exercicio.", result.error || result.reason);
      setSaveStatus(host, "Nao foi possivel salvar este exercício agora.", "error");
    } catch (error) {
      console.warn("Falha ao salvar o exercicio gerado.", error);
      setSaveStatus(host, "Nao foi possivel salvar este exercício agora.", "error");
    }
  }

  function renderShell(host) {
    const selectId = `termo-exercise-select-${Math.random().toString(36).slice(2, 10)}`;
    const title = host.dataset.exerciseTitle || "Exercício";
    const theme = host.dataset.exerciseTheme || "purple";
    const levelLabel = host.dataset.exerciseLevelLabel || "Nível";

    host.dataset.exerciseMounted = "true";
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
        <strong>Aviso importante:</strong> todo o conteúdo didático das páginas e do livro associado foi criado pelo Prof. Mario Reis.
        O aplicativo de criação de exercícios é um experimento didático; os exercícios e soluções serão gerados automaticamente por IA e
        <strong>podem conter erros conceituais, matemáticos ou pedagógicos</strong>. Erros detectados devem ser comunicados para
        <a href="mailto:marioreis@id.uff.br">marioreis@id.uff.br</a>.
      </div>

      <div class="termo-exercise__save-status" data-role="save-status" hidden></div>

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

    if (!generateBtn || !toggleBtn || !difficulty || !output || !solution || !solutionPanel || !outputTitle) return;

    const ctx = getPageContext(host);
    generateBtn.disabled = true;
    toggleBtn.disabled = true;
    solutionPanel.style.display = "none";

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
        throw new Error(
          data?.details?.error?.message ||
          data?.details?.error ||
          data?.details?.message ||
          data?.error ||
          `Erro HTTP ${response.status}`
        );
      }

      outputTitle.innerHTML = `
        <i class="fa-solid fa-circle-question"></i>
        ${escapeHtml(data.title || "Exercício")}
      `;
      output.classList.remove("termo-exercise__placeholder");
      output.innerHTML = formatGeneratedText(data.statement || "A API não retornou um enunciado.");

      solution.classList.remove("termo-exercise__placeholder");
      solution.innerHTML = formatGeneratedText(data.solution || "A API não retornou uma solução.");

      await typesetMath([output, solution]);
      toggleBtn.disabled = !(data.solution || "").trim();
      await persistExercise(host, buildExerciseRecord(ctx, data, difficulty.value));
    } catch (error) {
      outputTitle.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Não foi possível gerar o exercício
      `;
      output.classList.add("termo-exercise__placeholder");
      output.innerHTML = `
        <p><strong>Erro retornado:</strong> ${escapeHtml(error && error.message ? error.message : "Falha ao chamar a API de exercícios.")}</p>
        <p>Verifique se o projeto está publicado no Vercel, se o arquivo <strong>api/exercicio.js</strong> existe e se a variável <strong>GEMINI_API_KEY</strong> foi configurada.</p>
      `;
      setSaveStatus(host, "", "");
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

    if (generateBtn) {
      generateBtn.addEventListener("click", function () {
        generate(host);
      });
    }

    if (toggleBtn && solutionPanel) {
      toggleBtn.addEventListener("click", function () {
        solutionPanel.style.display = solutionPanel.style.display === "block" ? "none" : "block";
      });
    }
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
