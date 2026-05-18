import { createClient } from '@supabase/supabase-js';
import { LANGUAGES } from '@/data';

function metaClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function generateMetadata({ params }) {
  try {
    const supabase = metaClient();
    const { lang: paramLang, word } = await params;
    const isUUID = word.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    const q = isUUID
      ? supabase.from('entries').select('primary_text, gloss_id, lang, type').eq('id', word).single()
      : supabase.from('entries').select('primary_text, gloss_id, lang, type').eq('lang', paramLang).eq('slug', word).single();
    const { data } = await q;
    if (!data) return {};
    const lang = LANGUAGES.find(l => l.id === data.lang);
    const title = `${data.primary_text}${lang ? ` (${lang.name})` : ''}`;
    const description = data.gloss_id ? `${data.primary_text} — ${data.gloss_id}${lang ? ` · Bahasa ${lang.name}` : ''}` : title;
    return {
      title,
      description,
      openGraph: { title: `${title} — Aksarantara`, description },
    };
  } catch {
    return {};
  }
}

export default function EntryLayout({ children }) { return children; }
