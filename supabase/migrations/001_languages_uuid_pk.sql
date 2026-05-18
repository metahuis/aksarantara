-- ============================================================
-- Migration 001: languages — add slug, change id to UUID
-- ============================================================
-- Run in Supabase SQL Editor (project > SQL Editor > New query)
-- Safe to re-run (uses IF EXISTS / IF NOT EXISTS throughout)
-- ============================================================

BEGIN;

-- ── Step 1: Add slug, populate from current text id ──────────
ALTER TABLE languages ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE languages SET slug = id WHERE slug IS NULL;
ALTER TABLE languages ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'languages_slug_unique'
  ) THEN
    ALTER TABLE languages ADD CONSTRAINT languages_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- ── Step 2: Drop FK constraints that reference languages(id) ─
ALTER TABLE entries  DROP CONSTRAINT IF EXISTS entries_lang_fkey;
ALTER TABLE speakers DROP CONSTRAINT IF EXISTS speakers_language_id_fkey;

-- ── Step 3: Rename current text id out of the way ────────────
ALTER TABLE languages RENAME COLUMN id TO _old_id;

-- ── Step 4: Add UUID id column ───────────────────────────────
ALTER TABLE languages ADD COLUMN id UUID DEFAULT gen_random_uuid();
UPDATE languages SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE languages ALTER COLUMN id SET NOT NULL;

-- ── Step 5: Swap primary key ─────────────────────────────────
ALTER TABLE languages DROP CONSTRAINT languages_pkey;
ALTER TABLE languages ADD PRIMARY KEY (id);

-- ── Step 6: Drop the old text id column ──────────────────────
ALTER TABLE languages DROP COLUMN _old_id;

-- ── Step 7: Re-add FKs pointing at languages(slug) ───────────
ALTER TABLE entries ADD CONSTRAINT entries_lang_fkey
  FOREIGN KEY (lang) REFERENCES languages(slug);

ALTER TABLE speakers ADD CONSTRAINT speakers_language_id_fkey
  FOREIGN KEY (language_id) REFERENCES languages(slug);

COMMIT;

-- ── Verify ───────────────────────────────────────────────────
SELECT id, slug, name FROM languages ORDER BY slug;
