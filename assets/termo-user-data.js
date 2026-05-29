(function () {
  if (window.TermoUserData) return;

  const TABLE_NAME = "saved_exercises";
  const FAVORITE_ITEMS_KEY = "termo_favorite_items";
  const MAX_FAVORITE_ITEMS = 120;

  function normalizeRecord(input) {
    const record = input || {};

    return {
      chapter_id: record.chapterId || null,
      item_id: record.itemId || null,
      page_path: record.pagePath || window.location.pathname,
      page_url: record.pageUrl || window.location.href,
      page_title: record.pageTitle || document.title || "Página do curso",
      difficulty: record.difficulty || "medio",
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
      .select("id, chapter_id, item_id, page_path, page_url, page_title, difficulty, exercise_title, statement, solution, created_at, is_favorite")
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
      .select("id, is_favorite")
      .single();

    if (error) {
      return { ok: false, reason: "update_failed", error };
    }

    return { ok: true, record: data };
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

    if (!key) return null;

    return {
      key,
      chapterId,
      itemId,
      label: record.label || `Capítulo ${Number(chapterId)} · Item ${itemId}`,
      title: record.title || `Item ${itemId}`,
      note: record.note || "",
      url: record.url || window.location.href,
      pagePath: record.pagePath || window.location.pathname,
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
    listFavoriteItems,
    toggleFavoriteItem,
    listFavoriteChapters,
    toggleFavoriteChapter,
    ensureSupabase,
    getSession,
    onAuthStateChange
  };
})();
