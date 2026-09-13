(function () {
  if (window.TermoRating) return;

  const STORAGE_KEY = "termo_app_rating_v1";
  const VISIT_GAP_MS = 30 * 60 * 1000;
  const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;
  const FAILURE_COOLDOWN_MS = 60 * 60 * 1000;
  const OPEN_DELAY_MS = 5000;
  const MAX_TRACKED_PAGES = 30;
  let selectedRating = 0;
  let activeDialog = null;
  let previousFocus = null;
  let openTimer = 0;
  let cachedAccessToken = "";
  let cachedRatedStatus = null;

  function readState() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      /* A avaliacao continua funcionando na sessao atual sem persistencia local. */
    }
  }

  function pageReference() {
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams();
      ["view", "chapter", "sim"].forEach(function (name) {
        const value = url.searchParams.get(name);
        if (value) params.set(name, value.slice(0, 40));
      });
      const query = params.toString();
      return (url.pathname + (query ? "?" + query : "")).slice(0, 240);
    } catch (_error) {
      return String(window.location.pathname || "/").slice(0, 240);
    }
  }

  function updateVisitState() {
    const now = Date.now();
    const state = readState();
    if (!state.lastSeenAt || now - Number(state.lastSeenAt) >= VISIT_GAP_MS) {
      state.visitCount = Number(state.visitCount || 0) + 1;
      state.pagesThisVisit = [];
    }

    const reference = pageReference();
    const pagesThisVisit = Array.isArray(state.pagesThisVisit) ? state.pagesThisVisit : [];
    if (!pagesThisVisit.includes(reference)) {
      pagesThisVisit.push(reference);
      state.pagesThisVisit = pagesThisVisit.slice(-MAX_TRACKED_PAGES);
      state.contentViewCount = Number(state.contentViewCount || 0) + 1;
    }
    state.lastSeenAt = now;
    writeState(state);
    return state;
  }

  function isEligible(state) {
    if (state.ratedAt) return false;
    if (Number(state.dismissedUntil || 0) > Date.now()) return false;
    if (Number(state.submitFailedUntil || 0) > Date.now()) return false;
    const visits = Number(state.visitCount || 0);
    const contentViews = Number(state.contentViewCount || 0);
    return visits >= 3 || (visits >= 2 && contentViews >= 2);
  }

  function track(eventName, properties) {
    if (window.TermoAnalytics && typeof window.TermoAnalytics.track === "function") {
      window.TermoAnalytics.track(eventName, properties || {});
    }
  }

  async function getAuthenticatedSession() {
    const startedAt = Date.now();
    while ((!window.TermoAuth || typeof window.TermoAuth.getSession !== "function") && Date.now() - startedAt < 5000) {
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 50);
      });
    }
    if (!window.TermoAuth || typeof window.TermoAuth.getSession !== "function") return null;
    return window.TermoAuth.getSession().catch(function () {
      return null;
    });
  }

  async function hasExistingRating(accessToken) {
    if (cachedAccessToken === accessToken && typeof cachedRatedStatus === "boolean") {
      return cachedRatedStatus;
    }
    const response = await fetch("/api/app-rating?scope=status", {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) throw new Error("rating_status_failed");
    const payload = await response.json().catch(function () {
      return {};
    });
    if (typeof payload.rated !== "boolean") throw new Error("rating_status_invalid");
    cachedAccessToken = accessToken;
    cachedRatedStatus = payload.rated;
    return payload.rated;
  }

  function rememberCompletedRating(rating) {
    const state = readState();
    state.ratedAt = state.ratedAt || Date.now();
    if (rating) state.rating = rating;
    delete state.dismissedUntil;
    delete state.submitFailedUntil;
    writeState(state);
    cachedRatedStatus = true;
  }

  function closeDialog() {
    if (!activeDialog) return;
    document.removeEventListener("keydown", handleKeydown, true);
    activeDialog.remove();
    activeDialog = null;
    selectedRating = 0;
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    previousFocus = null;
  }

  function dismiss() {
    const state = readState();
    state.dismissedUntil = Date.now() + DISMISS_MS;
    writeState(state);
    track("rating_prompt_dismissed", {});
    closeDialog();
  }

  function handleKeydown(event) {
    if (!activeDialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(activeDialog.querySelectorAll("button:not([disabled]), textarea:not([disabled])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectRating(value) {
    selectedRating = value;
    if (!activeDialog) return;
    activeDialog.querySelectorAll("[data-termo-rating-star]").forEach(function (button) {
      const selected = Number(button.dataset.termoRatingStar) <= value;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", Number(button.dataset.termoRatingStar) === value ? "true" : "false");
    });
    const followup = activeDialog.querySelector("[data-termo-rating-followup]");
    const question = activeDialog.querySelector("[data-termo-rating-question]");
    followup.hidden = false;
    question.textContent = value <= 3
      ? "O que podemos melhorar? (opcional)"
      : "O que você mais gostou? (opcional)";
    activeDialog.querySelector("[data-termo-rating-submit]").disabled = false;
    activeDialog.querySelector("[data-termo-rating-feedback]").focus();
    track("rating_selected", { rating: value });
  }

  async function submitRating() {
    if (!activeDialog || selectedRating < 1 || selectedRating > 5) return;
    const submit = activeDialog.querySelector("[data-termo-rating-submit]");
    const dismissButton = activeDialog.querySelector("[data-termo-rating-dismiss]");
    const feedback = activeDialog.querySelector("[data-termo-rating-feedback]");
    const status = activeDialog.querySelector("[data-termo-rating-status]");
    submit.disabled = true;
    dismissButton.disabled = true;
    status.textContent = "Enviando sua avaliação…";

    const state = readState();
    try {
      const session = await getAuthenticatedSession();
      if (!session?.access_token) throw new Error("rating_auth_required");
      const response = await fetch("/api/app-rating", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          rating: selectedRating,
          feedback: feedback.value,
          pagePath: pageReference(),
          visitCount: Number(state.visitCount || 0),
          contentViewCount: Number(state.contentViewCount || 0)
        })
      });
      if (!response.ok) throw new Error("rating_submit_failed");

      cachedAccessToken = session.access_token;
      rememberCompletedRating(selectedRating);
      track("rating_submitted", { rating: selectedRating, has_feedback: Boolean(feedback.value.trim()) });
      status.textContent = "Obrigado! Sua opinião ajuda a melhorar o TERMO.";
      window.setTimeout(closeDialog, 1300);
    } catch (_error) {
      state.submitFailedUntil = Date.now() + FAILURE_COOLDOWN_MS;
      writeState(state);
      submit.disabled = false;
      dismissButton.disabled = false;
      status.textContent = "Não foi possível enviar agora. Você pode tentar novamente nesta tela.";
    }
  }

  function buildDialog() {
    const backdrop = document.createElement("div");
    backdrop.className = "termo-rating-backdrop";
    backdrop.dataset.termoRatingBackdrop = "true";
    backdrop.innerHTML = [
      '<section class="termo-rating-dialog" role="dialog" aria-modal="true" aria-labelledby="termo-rating-title" aria-describedby="termo-rating-copy">',
      '  <p class="termo-rating-eyebrow">Sua experiência</p>',
      '  <h2 class="termo-rating-title" id="termo-rating-title">Como você avalia o TERMO?</h2>',
      '  <p class="termo-rating-copy" id="termo-rating-copy">Escolha de 1 a 5 estrelas. Não armazenamos seu nome ou e-mail junto à avaliação.</p>',
      '  <div class="termo-rating-stars" role="group" aria-label="Escolha uma nota de 1 a 5">',
      [1, 2, 3, 4, 5].map(function (value) {
        return '<button class="termo-rating-star" type="button" data-termo-rating-star="' + value + '" aria-label="' + value + (value === 1 ? ' estrela' : ' estrelas') + '" aria-pressed="false">★</button>';
      }).join(""),
      '  </div>',
      '  <div class="termo-rating-followup" data-termo-rating-followup hidden>',
      '    <p class="termo-rating-question" data-termo-rating-question></p>',
      '    <textarea class="termo-rating-feedback" data-termo-rating-feedback maxlength="600" placeholder="Conte-nos em poucas palavras"></textarea>',
      '    <p class="termo-rating-privacy">Não inclua nome, e-mail ou outros dados pessoais.</p>',
      '  </div>',
      '  <p class="termo-rating-status" data-termo-rating-status aria-live="polite"></p>',
      '  <div class="termo-rating-actions">',
      '    <button class="termo-rating-button termo-rating-button--secondary" type="button" data-termo-rating-dismiss>Agora não</button>',
      '    <button class="termo-rating-button termo-rating-button--primary" type="button" data-termo-rating-submit disabled>Enviar avaliação</button>',
      '  </div>',
      '</section>'
    ].join("\n");

    backdrop.querySelectorAll("[data-termo-rating-star]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectRating(Number(button.dataset.termoRatingStar));
      });
    });
    backdrop.querySelector("[data-termo-rating-dismiss]").addEventListener("click", dismiss);
    backdrop.querySelector("[data-termo-rating-submit]").addEventListener("click", function () {
      void submitRating();
    });
    return backdrop;
  }

  async function openDialog() {
    if (activeDialog || document.querySelector("[data-termo-rating-backdrop]")) return;
    const state = readState();
    if (!isEligible(state)) return;
    const session = await getAuthenticatedSession();
    if (!session?.access_token) return;
    let alreadyRated = false;
    try {
      alreadyRated = await hasExistingRating(session.access_token);
    } catch (_error) {
      return;
    }
    if (alreadyRated) {
      rememberCompletedRating();
      return;
    }
    if (activeDialog || document.querySelector("[data-termo-rating-backdrop]")) return;
    if (!isEligible(readState())) return;
    previousFocus = document.activeElement;
    activeDialog = buildDialog();
    document.body.appendChild(activeDialog);
    document.addEventListener("keydown", handleKeydown, true);
    activeDialog.querySelector("[data-termo-rating-star]").focus();
    track("rating_prompt_shown", {
      visit_count: Number(state.visitCount || 0),
      content_view_count: Number(state.contentViewCount || 0)
    });
  }

  function scheduleOpen(delay) {
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(function () {
      void openDialog();
    }, delay);
  }

  function boot() {
    const state = updateVisitState();
    if (!isEligible(state)) return;
    scheduleOpen(OPEN_DELAY_MS);
  }

  window.addEventListener("termo-auth-state-change", function (event) {
    if (event.detail?.session?.access_token && isEligible(readState())) {
      scheduleOpen(OPEN_DELAY_MS);
    }
  });

  window.TermoRating = {
    open: function () { return openDialog(); },
    isEligible: function () { return isEligible(readState()); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
