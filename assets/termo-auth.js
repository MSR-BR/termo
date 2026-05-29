(function () {
  if (window.TermoAuth) return;

  const CONFIG_ENDPOINT = "/api/public-config";
  const SUPABASE_ESM_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
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

  const state = {
    config: null,
    configPromise: null,
    supabasePromise: null,
    supabase: null,
    modal: null,
    triggerButton: null,
    favoriteButton: null,
    statusNode: null,
    session: null,
    authListenerRegistered: false,
    progressSignature: "",
    refreshTimer: null,
    observer: null,
    chapterTopicsCache: Object.create(null),
    itemContextCacheKey: "",
    itemContext: undefined,
    itemContextPromise: null,
    bootPromise: null,
    readyPromise: null,
    resolveReady: null
  };

  state.readyPromise = new Promise(function (resolve) {
    state.resolveReady = resolve;
  });

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

  function isIndexPage() {
    return Boolean(document.getElementById("chapterList")) || /(^|\/)index\.html$/.test(window.location.pathname);
  }

  function truncate(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trimEnd()}...`;
  }

  function getCurrentItemContext() {
    const label = textContent(document.querySelector(".chapter-label"));
    if (!label) return null;

    const match = label.match(/Cap[ií]tulo\s+(\d+)\s*[·•-]\s*Item\s+([0-9.]+)/i);
    if (!match) return null;

    const chapterId = String(match[1] || "").padStart(2, "0");
    const itemId = String(match[2] || "").trim();
    const title = firstText(TITLE_SELECTORS) || document.title || `Item ${itemId}`;
    const note = truncate(
      textContent(document.querySelector(".chapter-text p")) ||
      textContent(document.querySelector(".hdr-sub")) ||
      "",
      170
    );

    return {
      chapterId,
      itemId,
      label: `Capítulo ${Number(chapterId)} · Item ${itemId}`,
      title,
      note,
      url: window.location.href,
      pagePath: window.location.pathname
    };
  }

  function normalizeUrlPath(value) {
    if (!value) return "";

    try {
      return new URL(value, window.location.origin).pathname.replace(/^\/+/, "");
    } catch (_error) {
      return String(value).split(/[?#]/)[0].replace(/^\/+/, "");
    }
  }

  function getChapterIdFromPathname(pathname) {
    const match = String(pathname || "").match(/\/slides\/capitulo-(\d+)\/page_\d+\.html$/i);
    return match ? String(match[1]).padStart(2, "0") : "";
  }

  async function loadChapterTopics(chapterId) {
    const normalizedChapterId = String(chapterId || "").padStart(2, "0");
    if (!normalizedChapterId) return [];

    if (!state.chapterTopicsCache[normalizedChapterId]) {
      state.chapterTopicsCache[normalizedChapterId] = fetch(`/data/capitulo-${normalizedChapterId}.json`, {
        credentials: "same-origin"
      })
        .then(async function (response) {
          if (!response.ok) return [];
          const payload = await response.json();
          return Array.isArray(payload?.topics) ? payload.topics : [];
        })
        .catch(function () {
          return [];
        });
    }

    return state.chapterTopicsCache[normalizedChapterId];
  }

  function invalidateItemContextCache() {
    state.itemContextCacheKey = "";
    state.itemContext = undefined;
    state.itemContextPromise = null;
  }

  async function resolveCurrentItemContext() {
    const directContext = getCurrentItemContext();
    const cacheKey = `${window.location.pathname}${window.location.search}`;

    if (directContext) {
      state.itemContextCacheKey = cacheKey;
      state.itemContext = directContext;
      state.itemContextPromise = null;
      return directContext;
    }

    if (state.itemContextCacheKey === cacheKey) {
      if (state.itemContext !== undefined) return state.itemContext;
      if (state.itemContextPromise) return state.itemContextPromise;
    }

    state.itemContextCacheKey = cacheKey;
    state.itemContextPromise = (async function () {
      const chapterId = getChapterIdFromPathname(window.location.pathname);
      if (!chapterId) return null;

      const currentPath = normalizeUrlPath(window.location.pathname);
      const topics = await loadChapterTopics(chapterId);
      const topic = topics.find(function (entry) {
        return normalizeUrlPath(entry?.url) === currentPath;
      });

      if (!topic || !topic.id) return null;

      const itemId = String(topic.id).trim();
      const title = topic.title || firstText(TITLE_SELECTORS) || document.title || `Item ${itemId}`;
      const note = truncate(
        topic.note ||
        textContent(document.querySelector(".chapter-text p")) ||
        textContent(document.querySelector(".hdr-sub")) ||
        "",
        170
      );

      return {
        chapterId,
        itemId,
        label: `Capítulo ${Number(chapterId)} · Item ${itemId}`,
        title,
        note,
        url: window.location.href,
        pagePath: window.location.pathname
      };
    })()
      .then(function (context) {
        state.itemContext = context;
        state.itemContextPromise = null;
        return context;
      })
      .catch(function () {
        state.itemContext = null;
        state.itemContextPromise = null;
        return null;
      });

    return state.itemContextPromise;
  }

  function buildPageContext() {
    const title = firstText(TITLE_SELECTORS) || "esta página";

    if (isIndexPage()) {
      return {
        kicker: "Acesso opcional",
        title: "Salve seu progresso",
        copy: "Entre com Google para guardar seu caminho, seus favoritos e seus exercícios sem bloquear o conteúdo."
      };
    }

    return {
      kicker: "Acesso opcional",
      title: "Continue este estudo depois",
      copy: `Entre com Google para salvar este ponto sobre ${title} e retomar exatamente daqui quando quiser.`
    };
  }

  function getFriendlyName(user) {
    const metadata = user?.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || user?.email || "";
    const firstName = String(fullName).trim().split(/\s+/)[0];
    return firstName || "Perfil";
  }

  function getAvatarUrl(user) {
    const metadata = user?.user_metadata || {};
    return metadata.avatar_url || metadata.picture || "";
  }

  function buildProgressSnapshot() {
    const title = firstText(TITLE_SELECTORS) || document.title || "Página do curso";
    const label = textContent(document.querySelector(".chapter-label")) || "Índice do curso";
    const url = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    return {
      title,
      label,
      url,
      seenAt: new Date().toISOString()
    };
  }

  function progressSignature(snapshot) {
    return JSON.stringify([snapshot.url, snapshot.title, snapshot.label]);
  }

  async function fetchConfig() {
    if (state.config) return state.config;
    if (state.configPromise) return state.configPromise;

    state.configPromise = fetch(CONFIG_ENDPOINT, { credentials: "same-origin" })
      .then(async function (response) {
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar a configuracao de login.");
        }
        const config = await response.json();
        state.config = config;
        return config;
      })
      .catch(function (error) {
        state.config = {
          authEnabled: false,
          error: String(error)
        };
        return state.config;
      });

    return state.configPromise;
  }

  async function ensureSupabase() {
    if (state.supabase) return state.supabase;
    if (state.supabasePromise) return state.supabasePromise;

    state.supabasePromise = (async function () {
      const config = await fetchConfig();
      if (!config.authEnabled) return null;

      const module = await import(SUPABASE_ESM_URL);
      const createClient = module.createClient;

      const client = createClient(
        config.supabaseUrl,
        config.supabasePublishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce"
          }
        }
      );

      state.supabase = client;
      return client;
    })();

    return state.supabasePromise;
  }

  function setStatus(message, isError) {
    if (!state.statusNode) return;
    state.statusNode.textContent = message || "";
    state.statusNode.classList.toggle("is-error", Boolean(isError));
  }

  function emitAuthState() {
    window.dispatchEvent(new CustomEvent("termo-auth-state-change", {
      detail: {
        session: state.session,
        user: state.session?.user || null
      }
    }));
  }

  function createModal() {
    const overlay = document.createElement("div");
    overlay.className = "termo-auth-overlay";
    overlay.setAttribute("data-termo-auth-overlay", "true");
    overlay.setAttribute("aria-hidden", "true");

    const context = buildPageContext();

    overlay.innerHTML = `
      <div class="termo-auth-modal" role="dialog" aria-modal="true" aria-labelledby="termoAuthTitle">
        <div class="termo-auth-modal-header">
          <div>
            <div class="termo-auth-kicker">${context.kicker}</div>
            <h2 class="termo-auth-title" id="termoAuthTitle">${context.title}</h2>
          </div>
          <button type="button" class="termo-auth-close" aria-label="Fechar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="termo-auth-body">
          <div class="termo-auth-copy">${context.copy}</div>
          <ul class="termo-auth-benefits">
            <li><i class="fa-solid fa-bookmark"></i><span>Salvar onde você parou.</span></li>
            <li><i class="fa-solid fa-star"></i><span>Guardar exercícios e favoritos.</span></li>
          </ul>
          <div class="termo-auth-panel" data-termo-auth-panel></div>
          <div class="termo-auth-status" data-termo-auth-status></div>
        </div>
      </div>
    `;

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    overlay.querySelector(".termo-auth-close").addEventListener("click", closeModal);
    document.body.appendChild(overlay);

    state.modal = overlay;
    state.statusNode = overlay.querySelector("[data-termo-auth-status]");
    return overlay;
  }

  function ensureModal() {
    return state.modal || createModal();
  }

  function closeModal() {
    if (!state.modal) return;
    state.modal.classList.remove("is-open");
    state.modal.setAttribute("aria-hidden", "true");
  }

  function sanitizeAuthUrl() {
    const url = new URL(window.location.href);
    const searchKeys = ["code", "state", "error", "error_code", "error_description"];
    const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
    let changed = false;

    searchKeys.forEach(function (key) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }

      if (hashParams.has(key)) {
        hashParams.delete(key);
        changed = true;
      }
    });

    if (!changed) return;

    const newHash = hashParams.toString();
    url.hash = newHash ? `#${newHash}` : "";
    window.history.replaceState({}, "", url.toString());
  }

  function buildCleanRedirectUrl() {
    const url = new URL(window.location.href);
    ["code", "state", "error", "error_code", "error_description"].forEach(function (key) {
      url.searchParams.delete(key);
    });

    const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
    ["code", "state", "error", "error_code", "error_description", "access_token", "refresh_token", "expires_in", "token_type", "provider_token", "provider_refresh_token"].forEach(function (key) {
      hashParams.delete(key);
    });
    const cleanHash = hashParams.toString();
    url.hash = cleanHash ? `#${cleanHash}` : "";
    return url.toString();
  }

  function getProfileLinks() {
    const params = new URLSearchParams(window.location.search);
    const chapterId = params.get("chapter") || "01";

    return {
      savedUrl: `/index.html?view=saved&chapter=${encodeURIComponent(chapterId)}`,
      favoritesUrl: `/index.html?view=favorites&chapter=${encodeURIComponent(chapterId)}`
    };
  }

  function navigateToPersonalArea(view) {
    const links = getProfileLinks();
    const targetUrl = view === "favorites" ? links.favoritesUrl : links.savedUrl;
    window.location.assign(targetUrl);
  }

  function openModal() {
    const modal = ensureModal();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    void hydrateModal();
  }

  function buildSetupPanel() {
    return `
      <div class="termo-auth-panel-title">Login pronto para ser ativado</div>
      <div class="termo-auth-panel-copy">
        O conteúdo continua aberto. Quando as chaves públicas forem configuradas no Vercel, este modal passa a oferecer o acesso com Google sem interromper a leitura.
      </div>
      <div class="termo-auth-muted">
        Variáveis esperadas: <code>PUBLIC_SUPABASE_URL</code>, <code>PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> e <code>PUBLIC_GOOGLE_CLIENT_ID</code>.
      </div>
    `;
  }

  function buildSignedOutPanel() {
    return `
      <div class="termo-auth-actions">
        <button type="button" class="termo-auth-google-button" data-termo-auth-google-button>
          <span class="termo-auth-google-icon" aria-hidden="true">G</span>
          <span>Fazer Login com o Google</span>
        </button>
      </div>
    `;
  }

  function buildSignedInPanel(user) {
    const avatarUrl = getAvatarUrl(user);
    const friendlyName = getFriendlyName(user);
    const email = user?.email || "";
    const metadata = user?.user_metadata || {};
    const savedTitle = metadata.termo_last_page_title || "";
    const savedLabel = metadata.termo_last_page_label || "";
    const savedPoint = savedTitle
      ? `<div class="termo-auth-muted">Último ponto salvo: ${savedLabel ? `${savedLabel} · ` : ""}${savedTitle}</div>`
      : "";
    const links = getProfileLinks();

    return `
      <div class="termo-auth-panel-title">Você já está com o progresso salvo</div>
      <div class="termo-auth-account">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="" class="termo-auth-account-avatar">` : `<div class="termo-auth-account-avatar"></div>`}
        <div>
          <div class="termo-auth-account-name">${friendlyName}</div>
          <div class="termo-auth-account-email">${email}</div>
        </div>
      </div>
      ${savedPoint}
      <div class="termo-auth-shortcuts">
        <a class="termo-auth-shortcut" href="${links.savedUrl}" data-termo-auth-goto-saved>
          <i class="fa-solid fa-book-bookmark"></i>
          <span>
            <strong>Meus exercícios</strong>
            <small>Revise tudo o que já foi gerado na sua conta.</small>
          </span>
        </a>
        <a class="termo-auth-shortcut" href="${links.favoritesUrl}" data-termo-auth-goto-favorites>
          <i class="fa-solid fa-star"></i>
          <span>
            <strong>Itens favoritos</strong>
            <small>Abra rapidamente os itens do curso que você marcou com estrela.</small>
          </span>
        </a>
      </div>
      <div class="termo-auth-actions">
        <button type="button" class="termo-auth-secondary" data-termo-auth-signout>Sair</button>
        <button type="button" class="termo-auth-secondary" data-termo-auth-close>Continuar leitura</button>
      </div>
    `;
  }

  async function startGoogleOAuth() {
    setStatus("Abrindo o login Google...");
    const supabase = await ensureSupabase();

    if (!supabase) {
      throw new Error("Autenticacao indisponivel.");
    }

    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildCleanRedirectUrl(),
        queryParams: {
          prompt: "select_account"
        }
      }
    });

    if (result.error) {
      throw result.error;
    }
  }

  async function hydrateModal() {
    const modal = ensureModal();
    const panel = modal.querySelector("[data-termo-auth-panel]");
    const config = await fetchConfig();

    setStatus("");

    if (!config.authEnabled) {
      panel.innerHTML = buildSetupPanel();
      return;
    }

    if (state.session?.user) {
      panel.innerHTML = buildSignedInPanel(state.session.user);
      const closeButton = panel.querySelector("[data-termo-auth-close]");
      const signOutButton = panel.querySelector("[data-termo-auth-signout]");
      const savedButton = panel.querySelector("[data-termo-auth-goto-saved]");
      const favoritesButton = panel.querySelector("[data-termo-auth-goto-favorites]");
      if (closeButton) closeButton.addEventListener("click", closeModal);
      if (savedButton) {
        savedButton.addEventListener("click", function () {
          closeModal();
        });
      }
      if (favoritesButton) {
        favoritesButton.addEventListener("click", function () {
          closeModal();
        });
      }
      if (signOutButton) {
        signOutButton.addEventListener("click", async function () {
          try {
            setStatus("Saindo...");
            const supabase = await ensureSupabase();
            if (supabase) {
              await supabase.auth.signOut({ scope: "local" });
            }
            setStatus("Sessão encerrada.");
            await refreshSession();
            await hydrateModal();
          } catch (error) {
            setStatus("Nao foi possivel sair agora.", true);
          }
        });
      }
      return;
    }

    panel.innerHTML = buildSignedOutPanel();
    const googleButton = panel.querySelector("[data-termo-auth-google-button]");

    if (googleButton) {
      googleButton.addEventListener("click", async function () {
        try {
          googleButton.disabled = true;
          await startGoogleOAuth();
        } catch (error) {
          setStatus("Nao foi possivel iniciar o login Google.", true);
        } finally {
          googleButton.disabled = false;
        }
      });
    }
  }

  function updateTriggerButton() {
    if (!state.triggerButton) return;

    const indexPage = isIndexPage();

    if (state.session?.user) {
      const avatarUrl = getAvatarUrl(state.session.user);
      const label = indexPage ? "Área pessoal" : getFriendlyName(state.session.user);
      state.triggerButton.innerHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="" class="auth-avatar"><span>${label}</span>`
        : `<i class="fa-solid fa-circle-user"></i><span>${label}</span>`;
      state.triggerButton.setAttribute("aria-label", "Abrir área pessoal e progresso salvo");
      return;
    }

    state.triggerButton.innerHTML = indexPage
      ? `
        <i class="fa-solid fa-circle-user"></i>
        <span>Entrar</span>
      `
      : `
        <i class="fa-solid fa-bookmark"></i>
        <span>Salvar progresso</span>
      `;
    state.triggerButton.setAttribute("aria-label", "Abrir opcoes de login para salvar progresso");
  }

  function createFavoriteButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "termo-favorite-trigger";
    button.setAttribute("data-termo-favorite-button", "true");
    button.addEventListener("click", async function () {
      const context = await resolveCurrentItemContext();
      if (!context) return;

      if (!state.session?.user) {
        openModal();
        return;
      }

      if (!window.TermoUserData || typeof window.TermoUserData.toggleFavoriteItem !== "function") {
        return;
      }

      button.disabled = true;

      const result = await window.TermoUserData.toggleFavoriteItem(context).catch(function (error) {
        return { ok: false, error };
      });

      button.disabled = false;

      if (!result.ok) return;

      updateFavoriteButton(Boolean(result.isFavorite));
    });
    return button;
  }

  function updateFavoriteButton(isFavorite) {
    if (!state.favoriteButton) return;

    const button = state.favoriteButton;
    button.classList.toggle("is-active", Boolean(isFavorite));
    button.innerHTML = `<i class="fa-${isFavorite ? "solid" : "regular"} fa-star"></i>`;
    button.setAttribute(
      "aria-label",
      state.session?.user
        ? (isFavorite ? "Remover item dos favoritos" : "Salvar item nos favoritos")
        : "Entrar para salvar item nos favoritos"
    );
    button.setAttribute(
      "title",
      state.session?.user
        ? (isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos")
        : "Entrar para salvar nos favoritos"
    );
  }

  async function refreshFavoriteButtonState() {
    if (!state.favoriteButton) return;

    const context = await resolveCurrentItemContext();
    if (!context) {
      state.favoriteButton.hidden = true;
      return;
    }

    state.favoriteButton.hidden = false;

    if (!state.session?.user || !window.TermoUserData || typeof window.TermoUserData.listFavoriteItems !== "function") {
      updateFavoriteButton(false);
      return;
    }

    const result = await window.TermoUserData.listFavoriteItems().catch(function () {
      return { ok: false, items: [] };
    });

    const isFavorite = Boolean(result.ok && result.items.some(function (item) {
      return item.chapterId === context.chapterId && item.itemId === context.itemId;
    }));

    updateFavoriteButton(isFavorite);
  }

  async function refreshSession() {
    const supabase = await ensureSupabase();
    if (!supabase) {
      state.session = null;
      state.progressSignature = "";
      updateTriggerButton();
      await refreshFavoriteButtonState();
      emitAuthState();
      return;
    }

    const result = await supabase.auth.getSession();
    state.session = result?.data?.session || null;
    if (!state.session?.user) {
      state.progressSignature = "";
    }
    updateTriggerButton();
    await refreshFavoriteButtonState();
    emitAuthState();
  }

  async function syncProgress(force) {
    const supabase = await ensureSupabase();
    if (!supabase || !state.session?.user) return;

    const snapshot = buildProgressSnapshot();
    const signature = progressSignature(snapshot);

    if (!force && signature === state.progressSignature) {
      return;
    }

    state.progressSignature = signature;

    await supabase.auth.updateUser({
      data: {
        termo_last_page_url: snapshot.url,
        termo_last_page_title: snapshot.title,
        termo_last_page_label: snapshot.label,
        termo_last_seen_at: snapshot.seenAt
      }
    });
  }

  async function bootAuthState() {
    if (state.bootPromise) {
      return state.bootPromise;
    }

    state.bootPromise = (async function () {
    const config = await fetchConfig();
    if (!config.authEnabled) {
      updateTriggerButton();
      emitAuthState();
      return;
    }

    const supabase = await ensureSupabase();
    if (!supabase) return;

    if (!state.authListenerRegistered) {
      supabase.auth.onAuthStateChange(function (_event, session) {
        state.session = session || null;
        if (!state.session?.user) {
          state.progressSignature = "";
        }
        updateTriggerButton();
        void refreshFavoriteButtonState();
        emitAuthState();
        if (state.session?.user) {
          void syncProgress(false);
        }
      });
      state.authListenerRegistered = true;
    }

    await refreshSession();
    sanitizeAuthUrl();
    if (state.session?.user) {
      void syncProgress(false);
    }
    })()
      .catch(function () {
        state.session = null;
        state.progressSignature = "";
        updateTriggerButton();
        emitAuthState();
      })
      .finally(function () {
        if (state.resolveReady) {
          state.resolveReady(state.session);
          state.resolveReady = null;
        }
      });

    return state.bootPromise;
  }

  async function waitUntilReady(timeoutMs) {
    const pendingBoot = state.bootPromise || bootAuthState();

    if (typeof timeoutMs === "number" && timeoutMs > 0) {
      await Promise.race([
        pendingBoot.catch(function () {
          return null;
        }),
        new Promise(function (resolve) {
          window.setTimeout(resolve, timeoutMs);
        })
      ]);
    } else {
      await pendingBoot;
    }

    return state.session;
  }

  function syncButtonMetrics(button, reference) {
    if (!button || !reference) return;

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

  function createTriggerButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "termo-auth-trigger index-back-button";
    button.setAttribute("data-termo-auth-button", "true");
    button.addEventListener("click", function () {
      if (isIndexPage() && state.session?.user) {
        navigateToPersonalArea("saved");
        return;
      }

      openModal();
    });
    return button;
  }

  function getToolbarHost() {
    return document.querySelector("[data-termo-header-tools]");
  }

  function getAnchorElements() {
    if (isIndexPage()) {
      const toolbarHost = getToolbarHost();
      return {
        anchor: toolbarHost,
        referenceButton: null
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
      referenceButton: chapterLabel ? referenceButton : null
    };
  }

  function ensureHost(anchor, referenceButton) {
    if (!anchor || !anchor.parentNode) return null;

    if (anchor.parentElement && anchor.parentElement.classList.contains("termo-share-inline")) {
      return anchor.parentElement;
    }

    const host = document.createElement("div");
    host.className = "termo-share-inline";
    host.setAttribute("data-termo-auth-inline", "true");

    const insertionPoint = referenceButton || anchor;
    insertionPoint.insertAdjacentElement("beforebegin", host);

    if (referenceButton && referenceButton.parentNode) {
      host.appendChild(referenceButton);
    }

    host.appendChild(anchor);
    return host;
  }

  function renderTrigger() {
    const { anchor, referenceButton } = getAnchorElements();
    if (!anchor) return null;

    if (isIndexPage() && anchor === getToolbarHost()) {
      let button = anchor.querySelector("[data-termo-auth-button]");
      if (!button) {
        button = createTriggerButton();
        const shareButton = anchor.querySelector("[data-termo-share-button]");
        if (shareButton) {
          anchor.insertBefore(button, shareButton);
        } else {
          anchor.appendChild(button);
        }
      }

      state.triggerButton = button;
      updateTriggerButton();
      return button;
    }

    const host = ensureHost(anchor, referenceButton);
    if (!host) return null;

    let button = host.querySelector("[data-termo-auth-button]");
    if (!button) {
      button = createTriggerButton();
      const shareButton = host.querySelector("[data-termo-share-button]");
      if (shareButton) {
        host.insertBefore(button, shareButton);
      } else {
        host.appendChild(button);
      }
    }

    state.triggerButton = button;
    syncButtonMetrics(button, referenceButton || host.querySelector(".index-back-button"));
    updateTriggerButton();

    let favoriteButton = host.querySelector("[data-termo-favorite-button]");
    if (!favoriteButton) {
      favoriteButton = createFavoriteButton();
      host.appendChild(favoriteButton);
    }
    state.favoriteButton = favoriteButton;
    syncButtonMetrics(favoriteButton, referenceButton || host.querySelector(".index-back-button"));
    state.favoriteButton.hidden = true;
    void refreshFavoriteButtonState();

    return button;
  }

  function scheduleRefresh() {
    window.clearTimeout(state.refreshTimer);
    state.refreshTimer = window.setTimeout(function () {
      invalidateItemContextCache();
      renderTrigger();
    }, 120);
  }

  function watchForChanges() {
    if (state.observer || !document.body) return;
    state.observer = new MutationObserver(scheduleRefresh);
    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function autoMount() {
    renderTrigger();
    watchForChanges();
    window.addEventListener("resize", scheduleRefresh);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden" && state.session?.user) {
        void syncProgress(false);
      }
    });
    void bootAuthState();
  }

  window.TermoAuth = {
    autoMount,
    openModal,
    closeModal,
    refresh: scheduleRefresh,
    fetchConfig,
    ensureSupabase,
    whenReady: waitUntilReady,
    isConfigured: async function () {
      const config = await fetchConfig();
      return Boolean(config?.authEnabled);
    },
    getSession: async function () {
      await waitUntilReady(1800);
      if (state.resolveReady) {
        return state.session;
      }
      if (!state.session) {
        await refreshSession();
      }
      return state.session;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  } else {
    autoMount();
  }
})();
