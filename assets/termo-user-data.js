(function () {
  if (window.TermoUserData) return;

  const TABLE_NAME = "saved_exercises";
  const SIMULATOR_ACTIVITY_TABLE = "simulator_activity";
  const FAVORITE_ITEMS_KEY = "termo_favorite_items";
  const MAX_FAVORITE_ITEMS = 120;

  function getCurrentPageReference() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/";
  }

  function toRelativeAppUrl(value) {
    const fallback = getCurrentPageReference();
    const raw = String(value || "").trim();

    if (!raw) return fallback;

    try {
      const url = new URL(raw, window.location.origin);
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    } catch (_error) {
      if (raw.startsWith("/")) return raw;
      if (raw.startsWith("?")) return `${window.location.pathname}${raw}`;
      if (raw.startsWith("#")) return `${window.location.pathname}${window.location.search}${raw}`;
      return fallback;
    }
  }

  function normalizeRecord(input) {
    const record = input || {};
    const pageReference = toRelativeAppUrl(record.pageUrl || record.pagePath || getCurrentPageReference());

    return {
      chapter_id: record.chapterId || null,
      item_id: record.itemId || null,
      page_path: pageReference,
      page_url: pageReference,
      page_title: record.pageTitle || document.title || "Página do curso",
      difficulty: record.difficulty || "medio",
      exercise_code: record.exerciseCode || record.exercise_id || null,
      exercise_title: record.exerciseTitle || "Exercício",
      statement: record.statement || "",
      solution: record.solution || "",
      source_model: record.sourceModel || null,
      is_favorite: Boolean(record.isFavorite)
    };
  }

  async function ensureSupabase() {
    if (!window.TermoAuth || typeof window.TermoAuth.ensureSupabase !== "function") {
      return null;
    }

    return window.TermoAuth.ensureSupabase();
  }

  async function getSession() {
    if (!window.TermoAuth || typeof window.TermoAuth.getSession !== "function") {
      return null;
    }

    return window.TermoAuth.getSession();
  }

  async function saveExercise(record) {
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { saved: false, reason: "auth_not_configured" };
    }

    if (!session?.user?.id) {
      return { saved: false, reason: "not_authenticated" };
    }

    const normalized = normalizeRecord(record);
    const payload = {
      user_id: session.user.id,
      ...normalized
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select("id, created_at")
      .single();

    if (error) {
      return {
        saved: false,
        reason: "insert_failed",
        error
      };
    }

    return {
      saved: true,
      record: data
    };
  }

  async function listExercises(options) {
    const config = options || {};
    const limit = Number(config.limit || 80);
    const favoritesOnly = Boolean(config.favoritesOnly);
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured", exercises: [] };
    }

    if (!session?.user?.id) {
      return { ok: false, reason: "not_authenticated", exercises: [] };
    }

    let query = supabase
      .from(TABLE_NAME)
      .select("id, exercise_code, chapter_id, item_id, page_path, page_url, page_title, difficulty, exercise_title, statement, solution, created_at, is_favorite")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (favoritesOnly) {
      query = query.eq("is_favorite", true);
    }

    const { data, error } = await query;

    if (error) {
      return {
        ok: false,
        reason: "query_failed",
        error,
        exercises: []
      };
    }

    return {
      ok: true,
      exercises: data || []
    };
  }

  async function updateFavorite(id, isFavorite) {
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured" };
    }

    if (!session?.user?.id) {
      return { ok: false, reason: "not_authenticated" };
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ is_favorite: Boolean(isFavorite) })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select("id, is_favorite")
      .single();

    if (error) {
      return { ok: false, reason: "update_failed", error };
    }

    return { ok: true, record: data };
  }

  function normalizeSimulatorActivityInput(input) {
    const record = input || {};
    const simulatorId = String(record.id || record.simulatorId || "").trim().toUpperCase();
    const simulatorSlug = String(record.slug || record.simulatorSlug || "").trim().toLowerCase();
    const simulatorTitle = String(record.title || record.simulatorTitle || "").replace(/\s+/g, " ").trim();
    const simulatorPath = String(record.standaloneUrl || record.path || record.simulatorPath || "")
      .split(/[?#]/)[0]
      .replace(/^\/+/, "")
      .trim();

    if (!/^S\d{2}$/.test(simulatorId)) return null;
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(simulatorSlug)) return null;
    if (!simulatorTitle || simulatorTitle.length > 160) return null;
    if (simulatorPath !== `simulators/${simulatorSlug}.html`) return null;

    return {
      simulatorId,
      simulatorSlug,
      simulatorTitle,
      simulatorPath
    };
  }

  function normalizeSimulatorActivityRow(row) {
    return {
      simulatorId: String(row?.simulator_id || ""),
      simulatorSlug: String(row?.simulator_slug || ""),
      simulatorTitle: String(row?.simulator_title || ""),
      simulatorPath: String(row?.simulator_path || ""),
      firstOpenedAt: row?.first_opened_at || null,
      lastOpenedAt: row?.last_opened_at || null,
      openCount: Math.max(0, Number(row?.open_count || 0))
    };
  }

  async function recordSimulatorOpen(input) {
    const normalized = normalizeSimulatorActivityInput(input);
    if (!normalized) {
      return { ok: false, reason: "invalid_simulator" };
    }

    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured" };
    }

    if (!session?.user?.id || session.user.is_anonymous) {
      return { ok: false, reason: "not_authenticated" };
    }

    const { data, error } = await supabase
      .rpc("record_simulator_open", {
        p_simulator_id: normalized.simulatorId,
        p_simulator_slug: normalized.simulatorSlug,
        p_simulator_title: normalized.simulatorTitle,
        p_simulator_path: normalized.simulatorPath
      })
      .single();

    if (error) {
      return { ok: false, reason: "record_failed", error };
    }

    const activity = normalizeSimulatorActivityRow(data);
    window.dispatchEvent(new CustomEvent("termo-simulator-activity-change", {
      detail: { activity }
    }));

    return { ok: true, activity };
  }

  async function listSimulatorActivity(options) {
    const config = options || {};
    const limit = Math.min(50, Math.max(1, Number(config.limit || 20)));
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured", activities: [] };
    }

    if (!session?.user?.id || session.user.is_anonymous) {
      return { ok: false, reason: "not_authenticated", activities: [] };
    }

    const { data, error } = await supabase
      .from(SIMULATOR_ACTIVITY_TABLE)
      .select("simulator_id, simulator_slug, simulator_title, simulator_path, first_opened_at, last_opened_at, open_count")
      .eq("user_id", session.user.id)
      .order("last_opened_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false, reason: "query_failed", error, activities: [] };
    }

    return {
      ok: true,
      activities: (data || []).map(normalizeSimulatorActivityRow)
    };
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

  async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || "";
  }

  async function listValidationReports(options) {
    const config = options || {};
    const token = await getAccessToken();

    if (!token) {
      return { ok: false, reason: "not_authenticated", reports: [] };
    }

    const params = new URLSearchParams();
    params.set("status", config.status || "pending");

    const response = await fetch(`/api/exercicio-validacao-admin?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await readApiPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        reason: "query_failed",
        error: payload,
        reports: []
      };
    }

    return {
      ok: true,
      reports: Array.isArray(payload.reports) ? payload.reports : []
    };
  }

  async function reviewValidationReport(reportId, decision, adminNote) {
    const token = await getAccessToken();

    if (!token) {
      return { ok: false, reason: "not_authenticated" };
    }

    const response = await fetch("/api/exercicio-validacao-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reportId,
        decision,
        adminNote: adminNote || ""
      })
    });
    const payload = await readApiPayload(response);

    if (!response.ok) {
      return {
        ok: false,
        reason: "update_failed",
        error: payload
      };
    }

    return {
      ok: true,
      report: payload.report,
      message: payload.message || ""
    };
  }

  async function listAppRatings() {
    const token = await getAccessToken();
    if (!token) return { ok: false, reason: "not_authenticated", ratings: [] };
    const response = await fetch("/api/app-rating", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "same-origin",
      cache: "no-store"
    });
    const payload = await readApiPayload(response);
    if (!response.ok) {
      return { ok: false, reason: "query_failed", error: payload, ratings: [] };
    }
    return {
      ok: true,
      summary: payload.summary || { total: 0, average: 0, withFeedback: 0, distribution: {} },
      ratings: Array.isArray(payload.ratings) ? payload.ratings : []
    };
  }

  async function deleteAppRating(id) {
    const token = await getAccessToken();
    if (!token) return { ok: false, reason: "not_authenticated" };
    const response = await fetch("/api/app-rating", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ id })
    });
    const payload = await readApiPayload(response);
    if (!response.ok) return { ok: false, reason: "delete_failed", error: payload };
    return { ok: true };
  }

  function buildFavoriteItemKey(chapterId, itemId) {
    const normalizedChapterId = String(chapterId || "").padStart(2, "0");
    const normalizedItemId = String(itemId || "").trim();
    return normalizedChapterId && normalizedItemId
      ? `${normalizedChapterId}:${normalizedItemId}`
      : "";
  }

  function normalizeFavoriteItem(input) {
    const record = input || {};
    const chapterId = String(record.chapterId || "").padStart(2, "0");
    const itemId = String(record.itemId || "").trim();
    const key = buildFavoriteItemKey(chapterId, itemId);
    const pageReference = toRelativeAppUrl(record.url || record.pagePath || getCurrentPageReference());

    if (!key) return null;

    return {
      key,
      chapterId,
      itemId,
      label: record.label || `Capítulo ${Number(chapterId)} · Item ${itemId}`,
      title: record.title || `Item ${itemId}`,
      note: record.note || "",
      url: pageReference,
      pagePath: pageReference,
      updatedAt: record.updatedAt || new Date().toISOString()
    };
  }

  function readFavoriteItemsFromMetadata(metadata) {
    const rawItems = Array.isArray(metadata?.[FAVORITE_ITEMS_KEY]) ? metadata[FAVORITE_ITEMS_KEY] : [];

    return rawItems
      .map(normalizeFavoriteItem)
      .filter(Boolean)
      .sort(function (left, right) {
        return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
      });
  }

  function emitFavoriteItemsChange(items) {
    window.dispatchEvent(new CustomEvent("termo-favorite-items-change", {
      detail: {
        items: Array.isArray(items) ? items : []
      }
    }));
  }

  async function listFavoriteItems() {
    const session = await getSession();

    if (!session?.user) {
      return {
        ok: false,
        reason: "not_authenticated",
        items: []
      };
    }

    return {
      ok: true,
      items: readFavoriteItemsFromMetadata(session.user.user_metadata || {})
    };
  }

  async function toggleFavoriteItem(item) {
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured" };
    }

    if (!session?.user) {
      return { ok: false, reason: "not_authenticated" };
    }

    const normalizedItem = normalizeFavoriteItem(item);
    if (!normalizedItem) {
      return { ok: false, reason: "invalid_item" };
    }

    const metadata = session.user.user_metadata || {};
    const current = readFavoriteItemsFromMetadata(metadata);
    const exists = current.some(function (entry) {
      return entry.key === normalizedItem.key;
    });

    const next = exists
      ? current.filter(function (entry) {
          return entry.key !== normalizedItem.key;
        })
      : [normalizedItem]
          .concat(current.filter(function (entry) {
            return entry.key !== normalizedItem.key;
          }))
          .slice(0, MAX_FAVORITE_ITEMS);

    const result = await supabase.auth.updateUser({
      data: {
        [FAVORITE_ITEMS_KEY]: next
      }
    });

    if (result.error) {
      return { ok: false, reason: "update_failed", error: result.error };
    }

    const items = readFavoriteItemsFromMetadata(result.data?.user?.user_metadata || {});
    emitFavoriteItemsChange(items);

    return {
      ok: true,
      items,
      isFavorite: !exists
    };
  }

  async function listFavoriteChapters() {
    const session = await getSession();

    if (!session?.user) {
      return {
        ok: false,
        reason: "not_authenticated",
        chapterIds: []
      };
    }

    const metadata = session.user.user_metadata || {};
    const chapterIds = Array.isArray(metadata.termo_favorite_chapters)
      ? metadata.termo_favorite_chapters.filter(Boolean).map(function (value) {
          return String(value).padStart(2, "0");
        })
      : [];

    return {
      ok: true,
      chapterIds
    };
  }

  async function toggleFavoriteChapter(chapterId) {
    const supabase = await ensureSupabase();
    const session = await getSession();

    if (!supabase) {
      return { ok: false, reason: "auth_not_configured" };
    }

    if (!session?.user) {
      return { ok: false, reason: "not_authenticated" };
    }

    const normalizedId = String(chapterId || "").padStart(2, "0");
    const metadata = session.user.user_metadata || {};
    const current = Array.isArray(metadata.termo_favorite_chapters)
      ? metadata.termo_favorite_chapters.map(function (value) {
          return String(value).padStart(2, "0");
        })
      : [];

    const exists = current.includes(normalizedId);
    const next = exists
      ? current.filter(function (value) { return value !== normalizedId; })
      : current.concat(normalizedId);

    const result = await supabase.auth.updateUser({
      data: {
        termo_favorite_chapters: next
      }
    });

    if (result.error) {
      return { ok: false, reason: "update_failed", error: result.error };
    }

    return {
      ok: true,
      chapterIds: next,
      isFavorite: !exists
    };
  }

  function onAuthStateChange(handler) {
    if (typeof handler !== "function") {
      return function () {};
    }

    const listener = function (event) {
      handler(event.detail || {});
    };

    window.addEventListener("termo-auth-state-change", listener);

    return function () {
      window.removeEventListener("termo-auth-state-change", listener);
    };
  }

  window.TermoUserData = {
    saveExercise,
    listExercises,
    updateFavorite,
    listValidationReports,
    reviewValidationReport,
    listAppRatings,
    deleteAppRating,
    recordSimulatorOpen,
    listSimulatorActivity,
    listFavoriteItems,
    toggleFavoriteItem,
    listFavoriteChapters,
    toggleFavoriteChapter,
    ensureSupabase,
    getSession,
    onAuthStateChange
  };
})();
