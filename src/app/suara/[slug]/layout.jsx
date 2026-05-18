import { createClient } from '@supabase/supabase-js';
import { LANGUAGES } from '@/data';

function metaClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function generateMetadata({ params }) {
  try {
    const supabase = metaClient();
    const { slug } = await params;
    const { data } = await supabase.from('speakers').select('name, language_id, age, village').eq('slug', slug).single();
    if (!data) return {};
    const lang = LANGUAGES.find(l => l.id === data.language_id);
    const title = data.name;
    const parts = [lang ? `Penutur ${lang.name}` : null, data.age ? `${data.age} tahun` : null, data.village || null].filter(Boolean);
    const description = parts.join(' · ');
    return {
      title,
      description,
      openGraph: { title: `${title} — Aksarantara`, description },
    };
  } catch {
    return {};
  }
}

export default function SuaraLayout({ children }) { return children; }
