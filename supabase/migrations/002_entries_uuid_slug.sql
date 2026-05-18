-- ============================================================
-- Migration 002: entries — add slug column, change id to UUID
-- ============================================================
-- Run AFTER migration 001 (languages uuid pk)
-- Run in Supabase SQL Editor
-- ============================================================

BEGIN;

-- ── Step 1: Add slug column ───────────────────────────────────
ALTER TABLE entries ADD COLUMN IF NOT EXISTS slug TEXT;

-- ── Step 2: Rename current text id out of the way ────────────
ALTER TABLE entries RENAME COLUMN id TO _old_id;

-- ── Step 3: Add UUID id column ───────────────────────────────
ALTER TABLE entries ADD COLUMN id UUID DEFAULT gen_random_uuid();
UPDATE entries SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE entries ALTER COLUMN id SET NOT NULL;

-- ── Step 4: Swap primary key ─────────────────────────────────
ALTER TABLE entries DROP CONSTRAINT entries_pkey;
ALTER TABLE entries ADD PRIMARY KEY (id);

-- ── Step 5: Keep old id as legacy_id for traceability ─────────
-- (seed scripts and logs reference composite ids like 'bugis-madeceng')
ALTER TABLE entries RENAME COLUMN _old_id TO legacy_id;

-- slug will be populated by the Node.js seed script (002_seed_slugs.cjs)
-- then the UNIQUE constraint will be added after seeding

COMMIT;

-- ── Verify ───────────────────────────────────────────────────
SELECT id, legacy_id, slug, lang, primary_text FROM entries LIMIT 5;
