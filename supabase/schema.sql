-- ============================================================
-- Aksarantara — Supabase Schema
-- Run this in the Supabase SQL editor (project > SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE entry_type AS ENUM (
  'word', 'phrase', 'peribahasa', 'story', 'song', 'pantun', 'mantra'
);

CREATE TYPE entry_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE user_role AS ENUM ('superadmin', 'moderator', 'contributor');

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id             UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username       TEXT UNIQUE NOT NULL,
  display_name   TEXT,
  avatar_url     TEXT,
  origin_province TEXT,
  origin_city    TEXT,
  origin_village TEXT,
  bio            TEXT,
  instagram      TEXT,
  twitter        TEXT,
  tiktok         TEXT,
  website        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── USER ROLES ───────────────────────────────────────────────
CREATE TABLE user_roles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'contributor',
  assigned_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── LANGUAGES ────────────────────────────────────────────────
CREATE TABLE languages (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,  -- 'bugis', 'konjo', etc. — used as FK target
  name           TEXT NOT NULL,
  region         TEXT,
  speakers       TEXT,
  status         TEXT,
  hub            TEXT,
  color          TEXT,
  note           TEXT,
  dialects       TEXT[],
  sample_word    TEXT,
  sample_meaning TEXT,
  sample_speaker TEXT,
  sample_village TEXT,
  wave           FLOAT[],
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── SPEAKERS ─────────────────────────────────────────────────
CREATE TABLE speakers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  age         INTEGER,
  village     TEXT,
  district    TEXT,
  city        TEXT,
  province    TEXT,
  language_id TEXT REFERENCES languages(slug),
  dialect     TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTRIES ──────────────────────────────────────────────────
CREATE TABLE entries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id       TEXT UNIQUE,  -- 'bugis-madeceng' for seed entries (traceability)
  slug            TEXT UNIQUE,  -- URL-safe slug e.g. 'madeceng', 'madeceng-bugis'
  lang            TEXT REFERENCES languages(slug) NOT NULL,
  type            entry_type NOT NULL,
  pos             TEXT,         -- noun|verb|adjective|numeral|other (word entries only)
  primary_text    TEXT NOT NULL,
  phonetic        TEXT,
  gloss           TEXT,
  gloss_id        TEXT,
  speaker         TEXT,
  speaker_age     INTEGER,
  speaker_village TEXT,
  dialect            TEXT,
  contextual_meaning TEXT,
  usage_example      TEXT,
  speaker_id         UUID REFERENCES speakers(id),
  audio_url          TEXT,
  contributor_id     UUID REFERENCES profiles(id),
  status             entry_status DEFAULT 'approved',
  -- Song / pantun
  lyrics          TEXT,
  lyrics_id       TEXT,
  -- Story / kisah
  story           TEXT,
  story_id        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── COORDINATORS ─────────────────────────────────────────────
CREATE TABLE coordinators (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT,
  language_ids TEXT[],
  region       TEXT,
  color        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PARTNERS ─────────────────────────────────────────────────
CREATE TABLE partners (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  short      TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners     ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: public read, own update
CREATE POLICY "profiles_public_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"    ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles: superadmin full, others read own
CREATE POLICY "roles_superadmin_all"   ON user_roles FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "roles_read_own"         ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- languages: public read, superadmin/moderator write
CREATE POLICY "languages_public_read"  ON languages FOR SELECT USING (true);
CREATE POLICY "languages_admin_write"  ON languages FOR ALL USING (get_my_role() IN ('superadmin', 'moderator'));

-- speakers: public read, superadmin/moderator write
CREATE POLICY "speakers_public_read"   ON speakers FOR SELECT USING (true);
CREATE POLICY "speakers_admin_write"   ON speakers FOR ALL USING (get_my_role() IN ('superadmin', 'moderator'));

-- entries: public read approved, contributor insert, admin all
CREATE POLICY "entries_public_read"    ON entries FOR SELECT USING (status = 'approved' OR auth.uid() = contributor_id);
CREATE POLICY "entries_contributor_insert" ON entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "entries_admin_all"      ON entries FOR ALL USING (get_my_role() IN ('superadmin', 'moderator'));

-- coordinators: public read, superadmin write
CREATE POLICY "coords_public_read"     ON coordinators FOR SELECT USING (true);
CREATE POLICY "coords_admin_write"     ON coordinators FOR ALL USING (get_my_role() = 'superadmin');

-- partners: public read, superadmin write
CREATE POLICY "partners_public_read"   ON partners FOR SELECT USING (true);
CREATE POLICY "partners_admin_write"   ON partners FOR ALL USING (get_my_role() = 'superadmin');

-- ============================================================
-- STORAGE BUCKETS (run separately or via dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
