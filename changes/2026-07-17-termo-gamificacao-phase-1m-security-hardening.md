# TERMO Gamificacao Phase 1M - Security hardening

Date: July 17, 2026

## Goal

Keep gamification writes behind the TERMO API instead of allowing direct browser writes to the Supabase tables.

## Change

- Authenticated users can still read their own gamification profile, event log, studied items and quiz attempts.
- Direct `insert`/`update` grants for authenticated users were removed from gamification write tables.
- Direct sequence access for public, anonymous and authenticated users was removed from the event log sequence.
- Direct insert/update RLS policies for event log, item progress and quiz attempts were removed.
- Server-side API handlers continue writing with the service role after validating the logged-in user and payload.

## Why

The frontend already sends progress through `/api/gamification-event` and `/api/chapter-quiz`. Allowing direct table writes would let a signed-in user fabricate quiz attempts or item progress through the REST API.

## Apply note

If the Phase 1C SQL was already applied, run:

`supabase/drafts/termo-gamification-phase-1m-security-hardening.sql`

This does not remove user data and should not change the visible student experience.
