// Migration 002 — seed slug field for all entries
// Run AFTER 002_entries_uuid_slug.sql has been applied in the SQL editor
// Run with: node scripts/002_seed_slugs.cjs
// Delete after use.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Load .env.local ──────────────────────────────────────────
const env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k) env[k.trim()] = v.join('=').trim();
  });

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SECRET_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Slug helper ──────────────────────────────────────────────
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[''ʼ`]/g, '')        // remove apostrophes / glottal stops
    .replace(/[^\w\s-]/g, '')      // remove other special chars
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim
}

async function run() {
  // ── 1. Fetch all entries ────────────────────────────────────
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, legacy_id, lang, primary_text, dialect')
    .order('lang');

  if (error) {
    console.error('Fetch failed:', error.message);
    console.log('\nDid you run 002_entries_uuid_slug.sql in the SQL editor first?\n');
    process.exit(1);
  }

  console.log(`Fetched ${entries.length} entries\n`);

  // ── 2. Compute slugs with collision avoidance ────────────────
  // Strategy:
  //   1st try  → slugify(primary_text)            e.g. 'basuo'
  //   2nd try  → slug + '-' + lang                e.g. 'basuo-minang'
  //   3rd try  → slug + '-' + lang + '-' + dialect e.g. 'basuo-minang-padang'
  //   fallback → slug + '-' + lang + '-' + index

  const assigned = new Map(); // slug → entry id
  const result   = [];

  for (const e of entries) {
    const base = slugify(e.primary_text);

    const candidates = [
      base,
      `${base}-${e.lang}`,
      e.dialect ? `${base}-${e.lang}-${slugify(e.dialect)}` : null,
    ].filter(Boolean);

    let chosen = null;
    for (const candidate of candidates) {
      if (!assigned.has(candidate)) {
        chosen = candidate;
        break;
      }
    }

    // Ultimate fallback: append numeric index
    if (!chosen) {
      let i = 2;
      while (assigned.has(`${base}-${e.lang}-${i}`)) i++;
      chosen = `${base}-${e.lang}-${i}`;
    }

    assigned.set(chosen, e.id);
    result.push({ id: e.id, slug: chosen, legacy_id: e.legacy_id });
  }

  // ── 3. Report collisions resolved ────────────────────────────
  const disambiguated = result.filter(r => r.slug.split('-').length > 1 &&
    slugify(entries.find(e => e.id === r.id)?.primary_text || '') !== r.slug);
  console.log(`Disambiguated: ${disambiguated.length}`);
  disambiguated.forEach(r => console.log(`  ${r.legacy_id || r.id} → ${r.slug}`));
  console.log();

  // ── 4. Batch update ──────────────────────────────────────────
  let ok = 0, fail = 0;
  for (let i = 0; i < result.length; i += 20) {
    const batch = result.slice(i, i + 20);
    await Promise.all(batch.map(async ({ id, slug }) => {
      const { error } = await supabase.from('entries').update({ slug }).eq('id', id);
      if (error) { console.error(`  ✗ ${id}: ${error.message}`); fail++; }
      else ok++;
    }));
    process.stdout.write(`  ${Math.min(i + 20, result.length)}/${result.length} updated…\r`);
  }

  console.log(`\nDone. ✅ ${ok} updated  ✗ ${fail} failed\n`);

  if (fail > 0) {
    console.log('Some updates failed — fix before adding UNIQUE constraint.');
    process.exit(1);
  }

  // ── 5. Add UNIQUE constraint ──────────────────────────────────
  // This can't be done via the JS client — run this in the SQL editor:
  console.log('All slugs set. Now run this in the Supabase SQL editor:\n');
  console.log('  ALTER TABLE entries ALTER COLUMN slug SET NOT NULL;');
  console.log('  ALTER TABLE entries ADD CONSTRAINT entries_slug_unique UNIQUE (slug);\n');
}

run().catch(err => { console.error(err); process.exit(1); });
