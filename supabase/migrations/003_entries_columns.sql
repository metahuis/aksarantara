-- ============================================================
-- Migration 003: entries — fix column mapping from contribute form
-- ============================================================
-- Problems fixed:
--   1. dialect       — form submits it but column didn't exist (silently dropped)
--   2. story         — was being reused for contextual_meaning; add dedicated column
--   3. meta          — was being reused for usage_example; rename to usage_example
-- ============================================================

BEGIN;

-- ── 1. Add dialect column ─────────────────────────────────────
ALTER TABLE entries ADD COLUMN IF NOT EXISTS dialect TEXT;

-- ── 2. Add contextual_meaning column ─────────────────────────
--    story column stays for actual story-type entry content
ALTER TABLE entries ADD COLUMN IF NOT EXISTS contextual_meaning TEXT;

-- ── 3. Rename meta → usage_example ───────────────────────────
--    Any existing values in meta were either:
--    - seed data: '35 · Sinjai' shorthand (no longer read — derived in frontend)
--    - form submissions: usage example text
--    Renaming preserves both without data loss
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'meta'
  ) THEN
    ALTER TABLE entries RENAME COLUMN meta TO usage_example;
  END IF;
END $$;

COMMIT;

-- ── Verify ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entries'
ORDER BY ordinal_position;
