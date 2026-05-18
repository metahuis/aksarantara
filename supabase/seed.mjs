/**
 * Aksarantara — Supabase seed script
 * Migrates src/data.js → Supabase database
 *
 * Usage:
 *   1. Copy .env.local.example → .env.local and fill in credentials
 *   2. node supabase/seed.js
 */

import { createClient } from '@supabase/supabase-js';
import { LANGUAGES, ARCHIVE_ENTRIES, COORDINATORS, PARTNERS } from '../src/data.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log('🌱 Seeding Aksarantara database...\n');

  // ── Languages ─────────────────────────────────────────────
  console.log('📍 Seeding languages...');
  const languageRows = LANGUAGES.map(l => ({
    id:             l.id,
    name:           l.name,
    region:         l.region,
    speakers:       l.speakers,
    status:         l.status,
    hub:            l.hub,
    color:          l.color,
    note:           l.note,
    dialects:       l.dialects ?? [],
    sample_word:    l.sample?.word ?? null,
    sample_meaning: l.sample?.meaning ?? null,
    sample_speaker: l.sample?.speaker ?? null,
    sample_village: l.sample?.village ?? null,
    wave:           l.wave ?? [],
  }));

  const { error: langErr } = await supabase.from('languages').upsert(languageRows);
  if (langErr) { console.error('❌ Languages:', langErr.message); process.exit(1); }
  console.log(`   ✅ ${languageRows.length} languages`);

  // ── Entries ───────────────────────────────────────────────
  console.log('📝 Seeding entries...');
  const entryRows = ARCHIVE_ENTRIES.map(e => ({
    id:              e.id,
    lang:            e.lang,
    type:            e.type,
    primary_text:    e.primary,
    phonetic:        e.phonetic ?? null,
    gloss:           e.gloss ?? null,
    gloss_id:        e.gloss_id ?? null,
    speaker:         e.speaker ?? null,
    speaker_age:     e.speaker_age ?? null,
    speaker_village: e.speaker_village ?? null,
    meta:            e.meta ?? null,
    audio_url:       null,
    contributor_id:  null,
    status:          'approved',
    lyrics:          e.lyrics ?? null,
    lyrics_id:       e.lyrics_id ?? null,
    story:           e.story ?? null,
    story_id:        e.story_id ?? null,
  }));

  // Batch insert in chunks of 100
  const CHUNK = 100;
  for (let i = 0; i < entryRows.length; i += CHUNK) {
    const chunk = entryRows.slice(i, i + CHUNK);
    const { error } = await supabase.from('entries').upsert(chunk);
    if (error) { console.error(`❌ Entries chunk ${i}:`, error.message); process.exit(1); }
    process.stdout.write(`   ${Math.min(i + CHUNK, entryRows.length)}/${entryRows.length}\r`);
  }
  console.log(`   ✅ ${entryRows.length} entries          `);

  // ── Coordinators ──────────────────────────────────────────
  console.log('👥 Seeding coordinators...');
  const coordRows = COORDINATORS.map(c => ({
    name:         c.name,
    role:         c.role ?? null,
    language_ids: c.languages ?? [],
    region:       c.region ?? null,
    color:        c.color ?? null,
  }));

  const { error: coordErr } = await supabase.from('coordinators').upsert(coordRows);
  if (coordErr) { console.error('❌ Coordinators:', coordErr.message); process.exit(1); }
  console.log(`   ✅ ${coordRows.length} coordinators`);

  // ── Partners ──────────────────────────────────────────────
  console.log('🤝 Seeding partners...');
  const partnerRows = PARTNERS.map(p => ({
    short: p.short,
    name:  p.name,
    role:  p.role ?? null,
  }));

  const { error: partnerErr } = await supabase.from('partners').upsert(partnerRows);
  if (partnerErr) { console.error('❌ Partners:', partnerErr.message); process.exit(1); }
  console.log(`   ✅ ${partnerRows.length} partners`);

  console.log('\n✅ Seed complete.');
  console.log(`   Languages:    ${languageRows.length}`);
  console.log(`   Entries:      ${entryRows.length}`);
  console.log(`   Coordinators: ${coordRows.length}`);
  console.log(`   Partners:     ${partnerRows.length}`);
}

seed().catch(err => { console.error(err); process.exit(1); });
