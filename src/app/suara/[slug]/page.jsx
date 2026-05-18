import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SuaraContent from './SuaraContent.jsx';

export const revalidate = 60;

export default async function SuaraPage({ params }) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const { data: speaker } = await supabase.from('speakers')
    .select('*, profile:profiles(display_name, username, avatar_url, bio)')
    .eq('slug', slug).single();

  if (!speaker) notFound();

  const { data: entries } = await supabase.from('entries')
    .select('id, primary_text, gloss_id, type, lang, slug, audio_url')
    .eq('speaker_id', speaker.id).eq('status', 'approved')
    .order('type').order('primary_text');

  return <SuaraContent speaker={speaker} entries={entries ?? []} />;
}
