import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { LANGUAGES } from '@/data.js';
import LanguageContent from './LanguageContent.jsx';

export const revalidate = 60;

export async function generateStaticParams() {
  return LANGUAGES.map(l => ({ id: l.id }));
}

const PAGE_SIZE = 12;

export default async function LanguagePage({ params }) {
  const { id } = await params;
  const lang = LANGUAGES.find(l => l.id === id);
  if (!lang) notFound();

  let initialEntries = [], initialTotal = 0, initialDialects = [], initialTypeCounts = {}, totalAll = 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [entriesResult, dialectsResult, countsResult, totalResult] = await Promise.all([
      supabase.from('entries')
        .select('*, speaker:speakers(*)', { count: 'exact' })
        .eq('lang', id).eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase.from('entries')
        .select('dialect')
        .eq('lang', id).eq('status', 'approved')
        .not('dialect', 'is', null),
      supabase.from('entries')
        .select('type')
        .eq('lang', id).eq('status', 'approved'),
      supabase.from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('lang', id).eq('status', 'approved'),
    ]);

    initialEntries  = entriesResult.data ?? [];
    initialTotal    = entriesResult.count ?? 0;
    initialDialects = [...new Set((dialectsResult.data ?? []).map(d => d.dialect).filter(Boolean))].sort();
    (countsResult.data ?? []).forEach(e => {
      initialTypeCounts[e.type] = (initialTypeCounts[e.type] || 0) + 1;
    });
    totalAll = totalResult.count ?? 0;
  }

  return (
    <LanguageContent
      lang={lang}
      initialEntries={initialEntries}
      initialTotal={initialTotal}
      initialDialects={initialDialects}
      initialTypeCounts={initialTypeCounts}
      totalAll={totalAll}
    />
  );
}
