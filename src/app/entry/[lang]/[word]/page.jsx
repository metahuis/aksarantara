import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { LANGUAGES } from '@/data.js';
import EntryContent from './EntryContent.jsx';

export const revalidate = 60;

export default async function EntryPage({ params }) {
  const { lang: langParam, word } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(word);
  const { data: entry } = await (isUUID
    ? supabase.from('entries').select('*, speaker:speakers(*)').eq('id', word).eq('status', 'approved').single()
    : supabase.from('entries').select('*, speaker:speakers(*)').eq('lang', langParam).eq('slug', word).eq('status', 'approved').single()
  );

  if (!entry) notFound();

  const lang = LANGUAGES.find(l => l.id === entry.lang) ?? LANGUAGES[0];

  const [relatedSameType, speakerResult] = await Promise.all([
    supabase.from('entries').select('id, lang, slug, primary_text, gloss, gloss_id, type')
      .eq('lang', entry.lang).eq('type', entry.type).eq('status', 'approved')
      .neq('id', entry.id).limit(4),
    entry.speaker_id
      ? supabase.from('entries').select('id', { count: 'exact', head: true })
          .eq('speaker_id', entry.speaker_id).eq('status', 'approved')
      : Promise.resolve({ count: 0 }),
  ]);

  const bucket = relatedSameType.data ?? [];
  let related = bucket;
  if (bucket.length < 4) {
    const usedIds = [entry.id, ...bucket.map(e => e.id)];
    const { data: fill } = await supabase.from('entries')
      .select('id, lang, slug, primary_text, gloss, gloss_id, type')
      .eq('lang', entry.lang).eq('status', 'approved')
      .neq('type', entry.type)
      .not('id', 'in', `(${usedIds.join(',')})`)
      .limit(4 - bucket.length);
    related = [...bucket, ...(fill ?? [])];
  }

  const speakerCount = speakerResult.count ?? 0;

  return <EntryContent entry={entry} lang={lang} related={related} speakerCount={speakerCount} />;
}
