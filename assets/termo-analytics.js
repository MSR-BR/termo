(function () {
  if (window.TermoAnalytics) return;

  const VERSION = "0702.1";
  const SESSION_KEY = "termo_analytics_session_v1";
  const DAILY_SESSION_KEY = "termo_analytics_session_day_v1";
  const QUEUE_LIMIT = 40;
  const BATCH_SIZE = 10;
  const FLUSH_DELAY_MS = 1800;
  const FLUSH_INTERVAL_MS = 15000;
  const EVENT_NAME_PATTERN = /^[a-z0-9_]{2,80}$/;
  const SIMULATOR_BY_FILE = {
    termometros: "S01",
    eqtermico: "S02",
    qt: "S03",
    mag: "S04",
    vdw: "S05",
    vdw_pv_gv: "S06",
    isotermico: "S07",
    mt_carnot: "S08",
    stirling_reg: "S09"
  };

  let configPromise = null;
  let queue = [];
  let flushTimer = null;
  let flushInFlight = false;
  let authUserId = "";
  let authAccessToken = "";

  function getStorage(storageName) {
    try {
      return window[storageName] || null;
    } catch (_error) {
      return null;
    }
  }

  function storageGet(storageName, key) {
    const storage = getStorage(storageName);
    if (!storage) return "";
    try {
      return storage.getItem(key) || "";
    } catch (_error) {
      return "";
    }
  }

  function storageSet(storageName, key, value) {
    const storage = getStorage(storageName);
    if (!storage) return;
    try {
      storage.setItem(key, value);
    } catch (_error) {
      /* ignore storage errors */
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "ta_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
  }

  function getSessionId() {
    let sessionId = storageGet("localStorage", SESSION_KEY);
    if (!sessionId) {
      sessionId = createId();
      storageSet("localStorage", SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function isSameHost(referrerUrl) {
    try {
      return new URL(referrerUrl).host === window.location.host;
    } catch (_error) {
      return false;
    }
  }

  function getReferrerHost() {
    if (!document.referrer || isSameHost(document.referrer)) return "";
    try {
      return new URL(document.referrer).host.slice(0, 120);
    } catch (_error) {
      return "";
    }
  }

  function getSafePath() {
    try {
      const url = new URL(window.location.href);
      const safeParams = new URLSearchParams();
      ["view", "chapter", "sim"].forEach(function (name) {
        const value = url.searchParams.get(name);
        if (value) safeParams.set(name, value.slice(0, 40));
      });
      const query = safeParams.toString();
      return (url.pathname + (query ? "?" + query : "")).slice(0, 240);
    } catch (_error) {
      return window.location.pathname.slice(0, 240);
    }
  }

  function getUtm(name) {
    try {
      return (new URL(window.location.href).searchParams.get(name) || "").slice(0, 80);
    } catch (_error) {
      return "";
    }
  }

  function cleanScalar(value) {
    if (value === null || typeof value === "undefined") return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 220);
    }
    return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 220);
  }

  function cleanProperties(properties) {
    const source = properties && typeof properties === "object" ? properties : {};
    const output = {};
    Object.keys(source).slice(0, 18).forEach(function (key) {
      const safeKey = String(key || "").replace(/[^a-zA-Z0-9_:-]/g, "_").slice(0, 60);
      if (!safeKey) return;
      const value = source[key];
      if (Array.isArray(value)) {
        output[safeKey] = value.slice(0, 8).map(cleanScalar).filter(function (item) { return item !== null && item !== ""; });
        return;
      }
      if (value && typeof value === "object") {
        output[safeKey] = cleanScalar(JSON.stringify(value));
        return;
      }
      const cleaned = cleanScalar(value);
      if (cleaned !== null && cleaned !== "") output[safeKey] = cleaned;
    });
    return output;
  }

  function textFromSelector(selector) {
    const node = document.querySelector(selector);
    return node ? String(node.textContent || "").trim() : "";
  }

  function inferChapterContext() {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const pathMatch = path.match(/capitulo-(\d+)\/page_(\d+)\.html/i);
    const label = [
      textFromSelector(".chapter-pill"),
      textFromSelector(".chapter-label"),
      textFromSelector("[data-chapter-label]"),
      textFromSelector(".slide-meta")
    ].join(" ");
    const labelMatch = label.match(/Cap[ií]tulo\s+(\d+)\s*[•.-]?\s*Item\s+([0-9]+(?:\.[0-9]+)?)/i);
    const queryChapter = url.searchParams.get("chapter") || "";

    return {
      chapter_id: (pathMatch?.[1] || labelMatch?.[1] || queryChapter || "").slice(0, 12),
      page_id: (pathMatch?.[2] || "").slice(0, 12),
      item_id: (labelMatch?.[2] || "").slice(0, 24)
    };
  }

  function simulatorIdFromUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      const querySim = url.searchParams.get("sim") || "";
      if (querySim) return querySim.toUpperCase().slice(0, 12);
      const file = (url.pathname.split("/").pop() || "").replace(/\.html$/i, "");
      return SIMULATOR_BY_FILE[file] || "";
    } catch (_error) {
      return "";
    }
  }

  function inferSimulatorId() {
    return simulatorIdFromUrl(window.location.href);
  }

  function getContext() {
    const chapter = inferChapterContext();
    return {
      session_id: getSessionId(),
      user_id: authUserId || null,
      chapter_id: chapter.chapter_id || null,
      item_id: chapter.item_id || null,
      page_id: chapter.page_id || null,
      simulator_id: inferSimulatorId() || null,
      path: getSafePath(),
      referrer_host: getReferrerHost() || null,
      utm_source: getUtm("utm_source") || null,
      utm_medium: getUtm("utm_medium") || null,
      utm_campaign: getUtm("utm_campaign") || null,
      utm_content: getUtm("utm_content") || null
    };
  }

  async function getPublicConfig() {
    if (!configPromise) {
      configPromise = (async function () {
        if (window.TermoAuth && typeof window.TermoAuth.fetchConfig === "function") {
          try {
            const config = await window.TermoAuth.fetchConfig();
            if (config?.supabaseUrl && config?.supabasePublishableKey) return config;
          } catch (_error) {
            /* fall back to public endpoint */
          }
        }
        const response = await fetch("/api/public-config", { cache: "no-store" });
        if (!response.ok) throw new Error("Nao foi possivel carregar a configuracao publica.");
        return response.json();
      })();
    }
    return configPromise;
  }

  async function refreshAuthState() {
    const readers = [
      function () { return window.TermoAuth?.getSession?.(); },
      function () { return window.TermoUserData?.getSession?.(); }
    ];

    for (const readSession of readers) {
      try {
        const session = await Promise.resolve(readSession());
        if (session?.access_token) {
          authAccessToken = session.access_token;
          authUserId = session.user?.id || authUserId || "";
          return;
        }
      } catch (_error) {
        /* try next source */
      }
    }
  }

  function requeue(events) {
    queue = events.concat(queue).slice(0, QUEUE_LIMIT);
  }

  async function flush(options) {
    if (flushInFlight || queue.length === 0) return;
    flushInFlight = true;
    if (flushTimer) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }

    const events = queue.splice(0, BATCH_SIZE);
    try {
      await refreshAuthState();
      const config = await getPublicConfig();
      if (!config?.supabaseUrl || !config?.supabasePublishableKey) return;

      const endpoint = String(config.supabaseUrl).replace(/\/$/, "") + "/rest/v1/app_analytics_events";
      const bearer = authAccessToken || config.supabasePublishableKey;
      const rows = events.map(function (event) {
        if (authUserId) event.user_id = authUserId;
        return event;
      });

      const response = await fetch(endpoint, {
        method: "POST",
        keepalive: Boolean(options?.keepalive),
        headers: {
          apikey: config.supabasePublishableKey,
          Authorization: "Bearer " + bearer,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(rows)
      });

      if (!response.ok && response.status >= 500) {
        requeue(events);
      }
    } catch (_error) {
      requeue(events);
    } finally {
      flushInFlight = false;
      if (queue.length) scheduleFlush(1200);
    }
  }

  function scheduleFlush(delay) {
    if (flushTimer) return;
    flushTimer = window.setTimeout(function () {
      void flush();
    }, typeof delay === "number" ? delay : FLUSH_DELAY_MS);
  }

  function track(eventName, properties) {
    const name = String(eventName || "").trim().toLowerCase();
    if (!EVENT_NAME_PATTERN.test(name)) return;
    const context = getContext();
    queue.push({
      ...context,
      event_name: name,
      properties: {
        ...cleanProperties(properties),
        analytics_version: VERSION
      }
    });
    if (queue.length > QUEUE_LIMIT) queue = queue.slice(queue.length - QUEUE_LIMIT);
    if (queue.length >= 5) {
      void flush();
    } else {
      scheduleFlush();
    }
  }

  function trackDailySession() {
    const key = todayKey();
    if (storageGet("localStorage", DAILY_SESSION_KEY) === key) return;
    storageSet("localStorage", DAILY_SESSION_KEY, key);
    track("session_start", {
      screen_width: window.screen?.width || 0,
      screen_height: window.screen?.height || 0,
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    });
  }

  function trackSimulatorPageOpen() {
    const simulatorId = inferSimulatorId();
    if (!simulatorId) return;
    const key = "termo_analytics_sim_open_" + simulatorId;
    if (storageGet("sessionStorage", key) === "1") return;
    storageSet("sessionStorage", key, "1");
    track("simulator_page_open", { simulator_id: simulatorId });
  }

  function nearestElement(target, selector) {
    return target instanceof Element ? target.closest(selector) : null;
  }

  function trackClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const bookButton = nearestElement(target, "[data-termo-book-button]");
    if (bookButton) {
      track("pdf_download_click", { label: String(bookButton.textContent || "").trim().slice(0, 80) });
      return;
    }

    const googleAuth = nearestElement(target, "[data-termo-auth-google-button]");
    if (googleAuth) {
      track("auth_google_click", {});
      return;
    }

    const authButton = nearestElement(target, "[data-termo-auth-button], [data-landing-login-target]");
    if (authButton) {
      track("auth_open_click", { label: String(authButton.textContent || "").trim().slice(0, 80) });
      return;
    }

    const signOut = nearestElement(target, "[data-termo-auth-signout]");
    if (signOut) {
      track("auth_signout_click", {});
      return;
    }

    const shareButton = nearestElement(target, "[data-termo-share-button]");
    if (shareButton) {
      track("share_click", { label: String(shareButton.textContent || "").trim().slice(0, 80) });
      return;
    }

    const favoriteButton = nearestElement(target, "[data-termo-favorite-button]");
    if (favoriteButton) {
      track("favorite_item_click", { active: favoriteButton.getAttribute("aria-pressed") || "" });
      return;
    }

    const generateButton = nearestElement(target, '[data-role="generate"]');
    if (generateButton) {
      const host = generateButton.closest(".termo-exercise");
      track("exercise_generate_click", {
        difficulty: host?.querySelector('[data-role="difficulty"]')?.value || ""
      });
      return;
    }

    const toggleSolution = nearestElement(target, '[data-role="toggle-solution"]');
    if (toggleSolution) {
      const host = toggleSolution.closest(".termo-exercise");
      track("exercise_solution_toggle_click", {
        difficulty: host?.querySelector('[data-role="difficulty"]')?.value || ""
      });
      return;
    }

    const submitValidation = nearestElement(target, '[data-role="submit-validation"]');
    if (submitValidation) {
      const host = submitValidation.closest(".termo-exercise");
      track("exercise_validation_click", {
        difficulty: host?.querySelector('[data-role="difficulty"]')?.value || ""
      });
      return;
    }

    const link = nearestElement(target, "a[href]");
    if (link) {
      const href = link.getAttribute("href") || "";
      const simulatorId = simulatorIdFromUrl(href);
      if (simulatorId || href.includes("msr-br.github.io/Termodinamica/")) {
        let targetHost = "";
        try { targetHost = new URL(href, window.location.href).host; } catch (_error) { targetHost = ""; }
        track("simulator_open_click", {
          simulator_id: simulatorId,
          target_host: targetHost,
          label: String(link.textContent || "").trim().slice(0, 80)
        });
      }
    }
  }

  function handleAuthState(event) {
    const previousUserId = authUserId;
    const session = event?.detail?.session || null;
    authUserId = session?.user?.id || event?.detail?.user?.id || "";
    authAccessToken = session?.access_token || "";
    if (authUserId && authUserId !== previousUserId) {
      const key = "termo_analytics_login_" + authUserId;
      if (storageGet("sessionStorage", key) !== "1") {
        storageSet("sessionStorage", key, "1");
        track("login_success", {});
      }
    }
  }

  window.TermoAnalytics = {
    track: track,
    flush: function () { return flush(); },
    getSessionId: getSessionId
  };

  document.addEventListener("click", trackClick, true);
  window.addEventListener("termo-auth-state-change", handleAuthState);
  window.addEventListener("termo-favorite-items-change", function (event) {
    track("favorite_items_changed", { count: Number(event?.detail?.count || 0) });
  });
  window.addEventListener("pagehide", function () {
    void flush({ keepalive: true });
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") void flush({ keepalive: true });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      void refreshAuthState().finally(function () {
        trackDailySession();
        trackSimulatorPageOpen();
      });
    }, { once: true });
  } else {
    void refreshAuthState().finally(function () {
      trackDailySession();
      trackSimulatorPageOpen();
    });
  }

  window.setInterval(function () {
    if (queue.length) void flush();
  }, FLUSH_INTERVAL_MS);
})();
