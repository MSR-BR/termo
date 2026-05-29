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

  function syncButtonMetrics(button, reference) {
    if (!button) return;

    if (!reference) {
      button.style.removeProperty("padding");
      button.style.removeProperty("border-radius");
      button.style.removeProperty("font-size");
      button.style.removeProperty("line-height");
      button.style.removeProperty("min-height");
      button.style.removeProperty("font-family");
      button.style.removeProperty("font-weight");
      button.style.removeProperty("color");
      button.style.removeProperty("background-color");
      button.style.removeProperty("border-color");
      button.style.removeProperty("border-style");
      button.style.removeProperty("border-width");
      button.style.removeProperty("box-shadow");
      return;
    }

    const styles = window.getComputedStyle(reference);
    button.style.paddingTop = styles.paddingTop;
    button.style.paddingRight = styles.paddingRight;
    button.style.paddingBottom = styles.paddingBottom;
    button.style.paddingLeft = styles.paddingLeft;
    button.style.borderRadius = styles.borderRadius;
    button.style.fontSize = styles.fontSize;
    button.style.lineHeight = styles.lineHeight;
    button.style.minHeight = styles.minHeight !== "0px" ? styles.minHeight : styles.height;
    button.style.fontFamily = styles.fontFamily;
    button.style.fontWeight = styles.fontWeight;
    button.style.color = styles.color;
    button.style.backgroundColor = styles.backgroundColor;
    button.style.borderColor = styles.borderColor;
    button.style.borderStyle = styles.borderStyle;
    button.style.borderWidth = styles.borderWidth;
    button.style.boxShadow = "none";
  }

  function createButton(isIndex) {
    const button = document.createElement("button");
    button.className = `termo-share-button${isIndex ? " termo-share-button--index" : ""} index-back-button`;
    button.type = "button";
    button.setAttribute("data-termo-share-button", "true");
    button.setAttribute("aria-label", "Enviar esta página para outra pessoa");
    button.innerHTML = `
      <i class="fa-solid fa-paper-plane"></i>
      <span>Enviar</span>
    `;
    button.addEventListener("click", function () {
      shareCurrentPage(button);
    });
    return button;
  }

  function createHost() {
    const host = document.createElement("div");
    host.className = "termo-share-inline";
    host.setAttribute("data-termo-share-inline", "true");
    return host;
  }

  function getToolbarHost() {
    return document.querySelector("[data-termo-header-tools]");
  }

  function ensureGroupedHost(anchor, isIndex, referenceButton) {
    if (!anchor || !anchor.parentNode) return null;

    let host;
    if (anchor.parentElement && anchor.parentElement.classList.contains("termo-share-inline")) {
      host = anchor.parentElement;
    } else {
      host = createHost();
      const insertionPoint = referenceButton || anchor;
      insertionPoint.insertAdjacentElement("beforebegin", host);
      if (referenceButton && referenceButton.parentNode) {
        host.appendChild(referenceButton);
      }
      host.appendChild(anchor);
    }

    let button = host.querySelector("[data-termo-share-button]");
    if (!button) {
      button = createButton(isIndex);
      host.appendChild(button);
    }

    syncButtonMetrics(button, referenceButton || host.querySelector(".index-back-button"));
    return button;
  }

  function getSlideElements() {
    if (isIndexPage()) {
      const toolbarHost = getToolbarHost();
      return {
        anchor: toolbarHost,
        referenceButton: null,
        isIndex: true
      };
    }

    const chapterLabel = document.querySelector(".chapter-label");
    const referenceButton = document.querySelector(".index-back-button");

    return {
      anchor:
        chapterLabel ||
        referenceButton ||
        document.querySelector(".hdr-title") ||
        document.querySelector(".chapter-title"),
      referenceButton: chapterLabel ? referenceButton : null,
      isIndex: false
    };
  }

  function render() {
    const { anchor, referenceButton, isIndex } = getSlideElements();
    if (!anchor) return null;

    if (isIndex && anchor === getToolbarHost()) {
      let button = anchor.querySelector("[data-termo-share-button]");
      if (!button) {
        button = createButton(true);
        anchor.appendChild(button);
      }
      return button;
    }

    return ensureGroupedHost(anchor, isIndex, referenceButton);
  }

  function refresh() {
    render();
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
      subtree: true
    });
  }

  function autoMount() {
    refresh();
    watchForChanges();
    window.addEventListener("resize", scheduleRefresh);
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
