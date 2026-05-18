-- ============================================================
-- Migration 004: entries — add speaker_id FK to speakers table
-- ============================================================

BEGIN;

-- ── 1. Add speaker_id column ──────────────────────────────────
ALTER TABLE entries ADD COLUMN IF NOT EXISTS speaker_id UUID REFERENCES speakers(id);

-- ── 2. Allow authenticated users to insert into speakers ──────
--    Existing policy only allows superadmin/moderator writes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'speakers' AND policyname = 'speakers_contributor_insert'
  ) THEN
    CREATE POLICY "speakers_contributor_insert"
      ON speakers FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMIT;

-- ── Verify ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entries' AND column_name = 'speaker_id';
