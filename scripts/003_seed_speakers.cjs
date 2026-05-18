// Migration — seed speakers table from existing entry data
// Run AFTER 004_entries_speaker_fk.sql has been applied in the SQL editor
// Run with: node scripts/003_seed_speakers.cjs
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

async function run() {
  // ── 1. Fetch entries that have speaker data but no speaker_id ─
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, speaker, speaker_age, speaker_village, lang, dialect')
    .not('speaker', 'is', null)
    .is('speaker_id', null);

  if (error) {
    console.error('Fetch failed:', error.message);
    console.log('\nDid you run 004_entries_speaker_fk.sql in the SQL editor first?\n');
    process.exit(1);
  }

  console.log(`Fetched ${entries.length} entries with speaker data and no speaker_id\n`);

  // ── 2. Deduplicate speakers ───────────────────────────────────
  // Key: name + village + lang — same person recording multiple words
  const speakerMap = new Map();

  for (const entry of entries) {
    const key = [entry.speaker, entry.speaker_village ?? '', entry.lang].join('|');
    if (!speakerMap.has(key)) {
      speakerMap.set(key, {
        name:        entry.speaker,
        age:         entry.speaker_age ?? null,
        // seed data stores location as a single string — put it all in village
        village:     entry.speaker_village ?? null,
        language_id: entry.lang,
        dialect:     entry.dialect ?? null,
        entryIds:    [entry.id],
      });
    } else {
      speakerMap.get(key).entryIds.push(entry.id);
    }
  }

  console.log(`Unique speakers: ${speakerMap.size}`);
  console.log(`Entries to update: ${entries.length}\n`);

  // ── 3. Insert speakers + update entries ───────────────────────
  let speakersCreated = 0;
  let entriesUpdated  = 0;
  let failed          = 0;

  for (const [, speaker] of speakerMap) {
    const { entryIds, ...payload } = speaker;

    const { data: speakerRow, error: insertErr } = await supabase
      .from('speakers')
      .insert(payload)
      .select('id')
      .single();

    if (insertErr) {
      console.error(`  ✗ speaker "${speaker.name}" (${speaker.language_id}): ${insertErr.message}`);
      failed++;
      continue;
    }

    speakersCreated++;

    // Batch-update all entries belonging to this speaker
    for (let i = 0; i < entryIds.length; i += 20) {
      const batch = entryIds.slice(i, i + 20);
      await Promise.all(batch.map(async (entryId) => {
        const { error: updateErr } = await supabase
          .from('entries')
          .update({ speaker_id: speakerRow.id })
          .eq('id', entryId);
        if (updateErr) {
          console.error(`  ✗ entry ${entryId}: ${updateErr.message}`);
          failed++;
        } else {
          entriesUpdated++;
        }
      }));
    }

    if (speakersCreated % 10 === 0) {
      process.stdout.write(`  ${speakersCreated}/${speakerMap.size} speakers done…\r`);
    }
  }

  console.log(`\nDone. ✅ ${speakersCreated} speakers created, ${entriesUpdated} entries linked  ✗ ${failed} failed\n`);

  if (failed > 0) {
    console.log('Some operations failed — check errors above before proceeding.');
    process.exit(1);
  }

  console.log('All speakers seeded. You can now safely drop the denormalized columns:');
  console.log('  ALTER TABLE entries DROP COLUMN speaker;');
  console.log('  ALTER TABLE entries DROP COLUMN speaker_age;');
  console.log('  ALTER TABLE entries DROP COLUMN speaker_village;\n');
  console.log('But first update all display queries to join speakers.');
}

run().catch(err => { console.error(err); process.exit(1); });
