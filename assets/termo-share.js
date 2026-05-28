(function () {
  if (window.TermoShare) return;

  const TITLE_SELECTORS = [
    ".main-title",
    ".chapter-title",
    ".hdr-title",
    ".title-main-heading",
    ".title-main-slide-heading",
    ".title-main-header",
    ".title-main-header-text",
    "h1"
  ];

  const SUMMARY_SELECTORS = [
    ".hdr-sub",
    ".chapter-text p",
    ".panel-description",
    ".body-text p",
    ".body-t",
    ".topic-note"
  ];

  let refreshTimer = null;
  let observer = null;

  function textContent(node) {
    return node && node.textContent ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = textContent(node);
      if (text) return text;
    }
    return "";
  }

  function truncate(value, maxLength) {
    const text = String(value || "").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trimEnd()}...`;
  }

  function sanitizeTitle(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s*[|·]\s*/g, " · ")
      .trim()
      .replace(/[.!?;:]+$/, "");
  }

  function sanitizeSummary(value, title) {
    const clean = String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?;:]+$/, "");

    if (!clean) return "";
    if (title && clean.toLowerCase() === title.toLowerCase()) return "";
    return truncate(clean, 170);
  }

  function isIndexPage() {
    return Boolean(document.getElementById("chapterList")) || /(^|\/)index\.html$/.test(window.location.pathname);
  }

  function buildIndexBlurb() {
    const panelTitle = firstText(["#panelTitle"]);
    const panelDescription = sanitizeSummary(firstText(["#panelDescription"]), panelTitle);

    if (panelTitle && panelTitle !== "Índice dos tópicos") {
      return `Achei este índice interativo sobre ${panelTitle}. Vale a pena explorar este material de Termodinâmica e compartilhar com quem gosta de Física.${panelDescription ? ` ${panelDescription}.` : ""}`;
    }

    return "Achei este guia interativo de Termodinâmica para Estudantes de Física. Vale muito a pena explorar os capítulos e compartilhar com quem se interessa por Física.";
  }

  function buildPageBlurb() {
    const title = sanitizeTitle(firstText(TITLE_SELECTORS) || document.title || "este material");
    const summary = sanitizeSummary(firstText(SUMMARY_SELECTORS), title);

    if (summary) {
      return `Achei este material sobre ${title}. Vale a pena ver esta explicação envolvente sobre ${summary}.`;
    }

    return `Achei este material sobre ${title}. Vale a pena conferir esta página e compartilhar com quem também se interessa por Física.`;
  }

  function getSharePayload() {
    const baseTitle = "Termodinâmica para Estudantes de Física";
    const pageTitle = sanitizeTitle(firstText(TITLE_SELECTORS) || document.title || baseTitle);
    const title = pageTitle && pageTitle !== baseTitle ? `${baseTitle} — ${pageTitle}` : baseTitle;
    const text = isIndexPage() ? buildIndexBlurb() : buildPageBlurb();
    const url = window.location.href;

    return { title, text, url };
  }

  function getMountTarget() {
    return (
      document.querySelector(".header-box") ||
      document.querySelector(".hero-inner") ||
      document.querySelector(".hdr-inner") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function setButtonFeedback(button, text) {
    if (!button) return;

    const originalLabel = button.dataset.originalLabel || button.innerHTML;
    button.dataset.originalLabel = originalLabel;
    button.classList.add("is-feedback");
    button.innerHTML = `<i class="fa-solid fa-check"></i><span>${text}</span>`;

    window.clearTimeout(Number(button.dataset.feedbackTimer || 0));
    const timer = window.setTimeout(function () {
      button.classList.remove("is-feedback");
      button.innerHTML = originalLabel;
    }, 1800);

    button.dataset.feedbackTimer = String(timer);
  }

  async function shareCurrentPage(button) {
    const payload = getSharePayload();

    try {
      button.disabled = true;

      if (navigator.share) {
        await navigator.share(payload);
        setButtonFeedback(button, "Enviado");
        return;
      }

      const clipboardText = `${payload.text}\n${payload.url}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clipboardText);
        setButtonFeedback(button, "Link copiado");
        return;
      }

      const mailto = `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(clipboardText)}`;
      window.location.href = mailto;
      setButtonFeedback(button, "Abrindo app");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      setButtonFeedback(button, "Tente de novo");
    } finally {
      button.disabled = false;
    }
  }

  function render(target) {
    if (!target) return null;

    let host = target.querySelector("[data-termo-share-mounted]");
    if (!host) {
      host = document.createElement("div");
      host.className = "termo-share";
      host.setAttribute("data-termo-share-mounted", "true");
      host.innerHTML = `
        <div class="termo-share__copy">
          <div class="termo-share__label">
            <i class="fa-solid fa-paper-plane"></i>
            Compartilhe esta página
          </div>
          <p class="termo-share__text"></p>
        </div>
        <button class="termo-share__button" type="button" aria-label="Enviar esta página para outra pessoa">
          <i class="fa-solid fa-paper-plane"></i>
          <span>Enviar</span>
        </button>
      `;

      const preferredAnchor = target.querySelector(".metadata, .chapter-text, .hdr-sub");
      if (preferredAnchor && preferredAnchor.parentNode === target) {
        preferredAnchor.insertAdjacentElement("afterend", host);
      } else {
        target.appendChild(host);
      }

      const button = host.querySelector(".termo-share__button");
      if (button) {
        button.addEventListener("click", function () {
          shareCurrentPage(button);
        });
      }
    }

    const textNode = host.querySelector(".termo-share__text");
    if (textNode) {
      const nextText = getSharePayload().text;
      if (textNode.textContent !== nextText) {
        textNode.textContent = nextText;
      }
    }

    return host;
  }

  function refresh() {
    render(getMountTarget());
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, 120);
  }

  function watchForChanges() {
    if (observer || !document.body) return;
    observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function autoMount() {
    refresh();
    watchForChanges();
  }

  window.TermoShare = {
    autoMount,
    refresh,
    getSharePayload
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  } else {
    autoMount();
  }
})();
