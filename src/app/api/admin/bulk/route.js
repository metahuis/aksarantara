import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST — bulk insert entries from CSV import
// Body: { rows: [{ lang, type, pos, primary_text, phonetic, gloss_id, gloss, dialect,
//                  contextual_meaning, usage_example,
//                  speaker_name, speaker_age, speaker_village }] }
export async function POST(request) {
  const { rows } = await request.json();
  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 });

  const supabase = adminClient();
  const results = { inserted: 0, failed: [] };

  // Deduplicate speakers by name+lang, create them first
  const speakerKeyMap = new Map(); // "name|lang|village" → speaker_id

  const uniqueSpeakers = [];
  const seenSpeakers = new Set();
  for (const row of rows) {
    if (!row.speaker_name) continue;
    const key = `${row.speaker_name}|${row.lang}|${row.speaker_village ?? ''}`;
    if (!seenSpeakers.has(key)) {
      seenSpeakers.add(key);
      uniqueSpeakers.push({
        key,
        name:        row.speaker_name,
        age:         row.speaker_age ? parseInt(row.speaker_age) : null,
        village:     row.speaker_village || null,
        language_id: row.lang,
        dialect:     row.dialect || null,
      });
    }
  }

  for (const s of uniqueSpeakers) {
    const { key, ...payload } = s;
    const { data, error } = await supabase.from('speakers').insert(payload).select('id').single();
    if (!error && data) speakerKeyMap.set(key, data.id);
  }

  // Insert entries in batches of 20
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const toInsert = batch.map(row => {
      const speakerKey = row.speaker_name
        ? `${row.speaker_name}|${row.lang}|${row.speaker_village ?? ''}`
        : null;
      return {
        lang:               row.lang,
        type:               row.type,
        pos:                row.type === 'word' ? (row.pos || null) : null,
        primary_text:       row.primary_text,
        slug:               row.slug || slugify(row.primary_text),
        phonetic:           row.phonetic || null,
        gloss_id:           row.gloss_id || null,
        gloss:              row.gloss || null,
        dialect:            row.dialect || null,
        contextual_meaning: row.contextual_meaning || null,
        usage_example:      row.usage_example || null,
        speaker_id:         row.speaker_id || (speakerKey ? (speakerKeyMap.get(speakerKey) ?? null) : null),
        status:             'approved',
      };
    });

    const { data, error } = await supabase.from('entries').insert(toInsert).select('id');
    if (error) {
      batch.forEach(row => results.failed.push({ row: row.primary_text, error: error.message }));
    } else {
      results.inserted += data?.length ?? 0;
    }
  }

  return NextResponse.json(results);
}
