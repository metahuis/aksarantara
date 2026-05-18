-- Add slug to speakers (set nullable first, seed, then enforce NOT NULL + UNIQUE)
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing speakers with a slug derived from name
UPDATE speakers
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Enforce uniqueness and not null after backfill
ALTER TABLE speakers ALTER COLUMN slug SET NOT NULL;
ALTER TABLE speakers ADD CONSTRAINT speakers_slug_unique UNIQUE (slug);
