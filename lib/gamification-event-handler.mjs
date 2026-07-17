import {
  applyEventToProfile,
  buildEventDay,
  buildProfilePatchFromApplied,
  ensureProfileRow,
  ensureSupabaseServerConfig,
  fetchAuthenticatedUser,
  fetchEventByIdempotencyKey,
  fetchItemProgressRow,
  insertEventLogRow,
  isGamificationRpcEnabled,
  isNonEmptyString,
  jsonResponse,
  mapProfileRowToJourneyProfile,
  normalizeIsoTimestamp,
  parseJsonBody,
  patchProfileRow,
  readBearerToken,
  supabaseRpcRequest,
  upsertItemProgressRow
} from "./gamification-shared.mjs";

const EVENT_TYPES = new Set([
  "study_item_complete",
  "chapter_quiz_completed",
  "chapter_quiz_review_completed",
  "chapter_quiz_retry_completed",
  "daily_return",
  "chapter_mastery_completed"
]);

const XP_BY_EVENT = {
  study_item_complete: 20,
  chapter_quiz_completed: 30,
  chapter_quiz_review_completed: 10,
  chapter_quiz_retry_completed: 10,
  daily_return: 8,
  chapter_mastery_completed: 80
};

function validateEventPayload(body) {
  const errors = [];

  if (!EVENT_TYPES.has(body.eventType)) {
    errors.push("eventType invalido.");
  }

  if (!isNonEmptyString(body.idempotencyKey)) {
    errors.push("idempotencyKey e obrigatorio.");
  }

  if (body.eventType === "study_item_complete" && !isNonEmptyString(body.itemId)) {
    errors.push("itemId e obrigatorio para study_item_complete.");
  }

  if (
    ["study_item_complete", "chapter_quiz_completed", "chapter_quiz_review_completed", "chapter_quiz_retry_completed", "chapter_mastery_completed"].includes(body.eventType) &&
    !isNonEmptyString(body.chapterId)
  ) {
    errors.push("chapterId e obrigatorio para este tipo de evento.");
  }

  const occurredAt = normalizeIsoTimestamp(body.occurredAt);
  if (body.occurredAt && !occurredAt) {
    errors.push("occurredAt precisa ser uma data valida.");
  }

  return {
    errors,
    normalized: {
      eventType: body.eventType || "",
      idempotencyKey: String(body.idempotencyKey || "").trim(),
      chapterId: String(body.chapterId || "").trim(),
      itemId: String(body.itemId || "").trim(),
      occurredAt,
      payload: body.payload && typeof body.payload === "object" ? body.payload : {}
    }
  };
}

function buildItemKey(chapterId, itemId) {
  return `${chapterId}:${itemId}`;
}

function buildEventLogPayload(normalized, extras = {}) {
  return {
    ...normalized.payload,
    occurredAt: normalized.occurredAt || "",
    ...extras
  };
}

function buildItemProgressPatch(normalizedEvent, sourceEventId = null) {
  if (normalizedEvent.eventType !== "study_item_complete") return null;

  return {
    chapter_id: normalizedEvent.chapterId,
    item_id: normalizedEvent.itemId,
    item_key: buildItemKey(normalizedEvent.chapterId, normalizedEvent.itemId),
    status: "studied",
    completed_at: normalizedEvent.occurredAt || new Date().toISOString(),
    last_reviewed_at: null,
    source_event_id: sourceEventId
  };
}

function buildEventResponse({
  user,
  profileRow,
  xpDelta,
  unlockedBadges,
  normalizedEvent,
  persisted,
  deduped = false,
  awarded = true,
  reason = ""
}) {
  return {
    ok: true,
    contractVersion: "phase-1c-live",
    persisted,
    deduped,
    awarded,
    reason,
    xpDelta,
    badgesUnlocked: unlockedBadges,
    normalizedEvent,
    profile: mapProfileRowToJourneyProfile(user, profileRow)
  };
}

export async function handleGamificationEventRequest({
  method,
  headers = {},
  body,
  env = process.env
}) {
  if (method !== "POST") {
    return jsonResponse(405, { error: "Use POST." });
  }

  const config = ensureSupabaseServerConfig(env);
  if (!config) {
    return jsonResponse(500, {
      error: "Gamificacao ainda nao configurada.",
      details: "Configure PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY antes da integracao real."
    });
  }

  const accessToken = readBearerToken(headers);
  if (!accessToken) {
    return jsonResponse(401, {
      error: "Entre com Google para registrar progresso."
    });
  }

  const user = await fetchAuthenticatedUser({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
    accessToken
  });

  if (!user?.id) {
    return jsonResponse(401, {
      error: "Nao foi possivel validar sua sessao."
    });
  }

  const requestBody = parseJsonBody(body);
  const validation = validateEventPayload(requestBody);

  if (validation.errors.length) {
    return jsonResponse(422, {
      error: "Payload invalido.",
      details: validation.errors
    });
  }

  const normalizedEvent = validation.normalized;
  const profileResult = await ensureProfileRow({
    config,
    userId: user.id
  });

  if (!profileResult.ok || !profileResult.row) {
    return jsonResponse(profileResult.status || 500, {
      error: "Nao foi possivel preparar sua jornada.",
      details: profileResult.error || "profile_prepare_failed"
    });
  }

  const duplicateEvent = await fetchEventByIdempotencyKey({
    config,
    idempotencyKey: normalizedEvent.idempotencyKey
  });

  if (!duplicateEvent.ok) {
    return jsonResponse(duplicateEvent.status || 500, {
      error: "Nao foi possivel verificar idempotencia.",
      details: duplicateEvent.error || "event_dedup_failed"
    });
  }

  if (duplicateEvent.row) {
    return jsonResponse(200, buildEventResponse({
      user,
      profileRow: profileResult.row,
      xpDelta: Number(duplicateEvent.row.xp_delta || 0),
      unlockedBadges: [],
      normalizedEvent,
      persisted: true,
      deduped: true,
      awarded: Number(duplicateEvent.row.xp_delta || 0) > 0,
      reason: "duplicate_idempotency_key"
    }));
  }

  const eventDay = buildEventDay(normalizedEvent.occurredAt);
  const xpDelta = Number(XP_BY_EVENT[normalizedEvent.eventType] || 0);

  if (normalizedEvent.eventType === "study_item_complete") {
    const itemKey = buildItemKey(normalizedEvent.chapterId, normalizedEvent.itemId);
    const existingItem = await fetchItemProgressRow({
      config,
      userId: user.id,
      itemKey
    });

    if (!existingItem.ok) {
      return jsonResponse(existingItem.status || 500, {
        error: "Nao foi possivel verificar o item estudado.",
        details: existingItem.error || "item_progress_check_failed"
      });
    }

    if (existingItem.row) {
      return jsonResponse(200, buildEventResponse({
        user,
        profileRow: profileResult.row,
        xpDelta: 0,
        unlockedBadges: [],
        normalizedEvent,
        persisted: false,
        awarded: false,
        reason: "item_already_studied"
      }));
    }
  }

  const applied = applyEventToProfile({
    profileRow: profileResult.row,
    eventType: normalizedEvent.eventType,
    chapterId: normalizedEvent.chapterId,
    eventDay,
    xpDelta,
    payload: normalizedEvent.payload
  });
  const profilePatchPayload = buildProfilePatchFromApplied(applied);
  const itemProgressPatch = buildItemProgressPatch(normalizedEvent);

  if (isGamificationRpcEnabled(env)) {
    const rpcResponse = await supabaseRpcRequest({
      config,
      fn: "apply_gamification_event_atomic",
      body: {
        p_user_id: user.id,
        p_event_type: normalizedEvent.eventType,
        p_idempotency_key: normalizedEvent.idempotencyKey,
        p_event_day: eventDay,
        p_chapter_id: normalizedEvent.chapterId || null,
        p_item_id: normalizedEvent.itemId || null,
        p_xp_delta: xpDelta,
        p_payload: buildEventLogPayload(normalizedEvent, {
          badgesUnlocked: applied.unlockedBadges
        }),
        p_profile_patch: profilePatchPayload,
        p_item_progress_patch: itemProgressPatch
      }
    });

    if (!rpcResponse.ok || !rpcResponse.payload?.profile) {
      return jsonResponse(rpcResponse.status || 500, {
        error: "Nao foi possivel consolidar o evento por RPC.",
        details: rpcResponse.payload || "event_rpc_failed"
      });
    }

    return jsonResponse(200, buildEventResponse({
      user,
      profileRow: rpcResponse.payload.profile,
      xpDelta: rpcResponse.payload.awarded ? xpDelta : 0,
      unlockedBadges: rpcResponse.payload.deduped || rpcResponse.payload.reason === "item_already_studied"
        ? []
        : applied.unlockedBadges,
      normalizedEvent,
      persisted: Boolean(rpcResponse.payload.persisted),
      deduped: Boolean(rpcResponse.payload.deduped),
      awarded: Boolean(rpcResponse.payload.awarded),
      reason: String(rpcResponse.payload.reason || "")
    }));
  }

  const eventLogInsert = await insertEventLogRow({
    config,
    row: {
      user_id: user.id,
      event_type: normalizedEvent.eventType,
      idempotency_key: normalizedEvent.idempotencyKey,
      event_day: eventDay,
      chapter_id: normalizedEvent.chapterId || null,
      item_id: normalizedEvent.itemId || null,
      xp_delta: xpDelta,
      payload: buildEventLogPayload(normalizedEvent, {
        badgesUnlocked: applied.unlockedBadges
      })
    }
  });

  if (!eventLogInsert.ok || !eventLogInsert.row) {
    return jsonResponse(eventLogInsert.status || 500, {
      error: "Nao foi possivel registrar o evento de gamificacao.",
      details: eventLogInsert.error || "event_insert_failed"
    });
  }

  if (normalizedEvent.eventType === "study_item_complete") {
    const itemProgressUpsert = await upsertItemProgressRow({
      config,
      row: {
        user_id: user.id,
        chapter_id: normalizedEvent.chapterId,
        item_id: normalizedEvent.itemId,
        item_key: buildItemKey(normalizedEvent.chapterId, normalizedEvent.itemId),
        status: "studied",
        completed_at: normalizedEvent.occurredAt || new Date().toISOString(),
        last_reviewed_at: null,
        source_event_id: eventLogInsert.row.id
      }
    });

    if (!itemProgressUpsert.ok) {
      return jsonResponse(itemProgressUpsert.status || 500, {
        error: "O evento foi registrado, mas o item estudado nao foi consolidado.",
        details: itemProgressUpsert.error || "item_progress_upsert_failed"
      });
    }
  }

  const profilePatch = await patchProfileRow({
    config,
    userId: user.id,
    patch: profilePatchPayload
  });

  if (!profilePatch.ok || !profilePatch.row) {
    return jsonResponse(profilePatch.status || 500, {
      error: "O evento foi registrado, mas o profile consolidado nao foi atualizado.",
      details: profilePatch.error || "profile_patch_failed"
    });
  }

  return jsonResponse(200, buildEventResponse({
    user,
    profileRow: profilePatch.row,
    xpDelta,
    unlockedBadges: applied.unlockedBadges,
    normalizedEvent,
    persisted: true,
    awarded: xpDelta > 0
  }));
}
