(function () {
  if (window.TermoAIExercise) return;

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

  function normalizeGeneratedMath(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\\\\/g, "\\")
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

  function formatGeneratedText(value) {
    const normalized = normalizeGeneratedMath(value);
    if (!normalized) return "";

    return normalized
      .split(/\n{2,}/)
      .map(function (paragraph) {
        const mathAware = autoFormatPlainMath(paragraph);
        return `<p>${escapeHtml(mathAware).replace(/\n/g, "<br>")}</p>`;
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
      document.querySelector(".content-root, .page, main, .slide-root, .slide-root-container, .slide-root-canvas, body") ||
      document.body;

    const clone = sourceNode.cloneNode(true);
    clone.querySelectorAll("[data-termo-ai-exercise], .termo-exercise, #aiExerciseBox, .ai-exercise-card, script, style, noscript").forEach(function (node) {
      node.remove();
    });

    const content = (clone.innerText || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 22000);

    return { title, subtitle, content };
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
          data?.error ||
          data?.details?.error ||
          data?.details?.message ||
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
